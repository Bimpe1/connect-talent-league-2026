import { describe, it, expect, afterEach } from 'vitest';
import { createRequire } from 'module';
import fs from 'fs';
import os from 'os';
import path from 'path';

const require = createRequire(import.meta.url);
const b = require('./broadcast.cjs');
const nodemailer = require('nodemailer');
const { SMTPServer } = require('smtp-server');

const config = {
  subject: 'Join the league',
  from_name: 'Connect Talent CIO',
  from_email: 'league@example.org',
  reply_to: 'help@example.org',
  unsubscribe_email: 'stop@example.org',
  video_url: 'https://example.org/video',
  signup_url: 'https://example.org/join',
  deadline: '',
  contact: 'Pat',
  charity_footer: 'Example charity 123.',
};
const templates = {
  text: 'Hi {{first_name}}, watch {{video_url}}. {{deadline_sentence}}Contact {{contact}}.',
  html: '<p>Hi {{first_name}}</p><a href="{{video_url}}">watch</a>',
};

describe('parseCsv', () => {
  it('handles BOM, CRLF, quotes, commas and blank lines', () => {
    const rows = b.parseCsv('﻿First Name,Email\r\n"Lee, A",lee@x.org\r\n\r\n"Say ""hi""",hi@x.org\r\n');
    expect(rows).toEqual([
      { first_name: 'Lee, A', email: 'lee@x.org' },
      { first_name: 'Say "hi"', email: 'hi@x.org' },
    ]);
  });
  it('returns [] for empty input', () => expect(b.parseCsv('')).toEqual([]));
});

describe('loadRecipients', () => {
  it('validates, lowercases, de-duplicates, applies the do-not-email list and falls back on the name', () => {
    const rows = [
      { email: ' Sam@X.org ', first_name: 'Sam Jones' },
      { email: 'sam@x.org', first_name: 'Dup' },
      { email: 'not-an-email', first_name: 'Bad' },
      { email: '', first_name: 'Blank' },
      { email: 'stop@x.org', first_name: 'Stopped' },
      { email: 'noname@x.org', first_name: '' },
      { email: 'a@b.co;c@d.co', first_name: 'Two' },
    ];
    const r = b.loadRecipients(rows, { suppressed: new Set(['stop@x.org']) });
    expect(r.recipients.map((x) => [x.email, x.first_name])).toEqual([['sam@x.org', 'Sam'], ['noname@x.org', 'there']]);
    expect(r.duplicates).toBe(1);
    expect(r.suppressed).toBe(1);
    expect(r.invalid).toHaveLength(3);
  });
});

describe('templates', () => {
  it('escapes HTML in values and refuses unknown placeholders', () => {
    expect(b.renderTemplate('<p>{{x}}</p>', { x: '<b>"&' }, { html: true })).toBe('<p>&lt;b&gt;&quot;&amp;</p>');
    expect(() => b.renderTemplate('{{missing}}', {})).toThrow(/missing/);
  });
  it('finds unfilled TODO / [bracket] values but allows an empty deadline', () => {
    expect(b.findPlaceholders({ a: 'TODO: x', b: 'fine', c: 'Call [name]', deadline: '' })).toEqual(['a', 'c']);
    expect(b.findPlaceholders(config)).toEqual([]);
  });
  it('builds a personalised message with an unsubscribe header, and marks tests', () => {
    const m = b.buildMessage({ email: 'sam@x.org', first_name: 'Sam' }, { ...config, deadline: 'Sunday' }, templates);
    expect(m.text).toBe('Hi Sam, watch https://example.org/video. Please register by Sunday. Contact Pat.');
    expect(m.headers['List-Unsubscribe']).toBe('<mailto:stop@example.org?subject=unsubscribe>');
    expect(m.replyTo).toBe('help@example.org');
    const t = b.buildMessage({ email: 'me@x.org', first_name: 'Sam' }, config, templates, { test: true });
    expect(t.subject).toBe('[TEST] Join the league');
    expect(t.text).toContain('Hi Test,');
  });
});

describe('pacing', () => {
  it('spreads sends evenly across the hour', () => {
    expect(b.delayForRate(100)).toBe(36000);
    expect(b.delayForRate(3600)).toBe(1000);
  });
});

// ---- end to end against a local fake mail server --------------------------------------------------------
let server;
let tmp;
afterEach(async () => {
  if (server) await new Promise((r) => server.close(r));
  server = null;
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
});

async function startServer({ rejectOn } = {}) {
  const received = [];
  server = new SMTPServer({
    authOptional: true,
    disabledCommands: ['STARTTLS'],
    onRcptTo(address, _session, cb) {
      if (rejectOn && address.address === rejectOn) {
        const err = new Error('452 Hourly sending limit exceeded');
        err.responseCode = 452;
        return cb(err);
      }
      cb();
    },
    onData(stream, session, cb) {
      let raw = '';
      stream.on('data', (c) => { raw += c.toString(); });
      stream.on('end', () => { received.push({ to: session.envelope.rcptTo.map((r) => r.address), raw }); cb(); });
    },
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const transport = nodemailer.createTransport({ host: '127.0.0.1', port: server.server.address().port, secure: false, ignoreTLS: true });
  return { received, transport };
}

const people = [
  { email: 'sam@x.org', first_name: 'Sam' },
  { email: 'alex@x.org', first_name: 'Alex' },
];

describe('sendAll (fake SMTP server)', () => {
  it('sends one personalised email each, then never emails anyone twice on a re-run', async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bc-'));
    const logPath = path.join(tmp, 'log.csv');
    const { received, transport } = await startServer();

    const first = await b.sendAll({ transport, recipients: people, config, templates, logPath, delayMs: 0 });
    expect(first).toMatchObject({ sent: 2, failed: 0, skippedAlreadySent: 0, stoppedBecause: null });
    expect(received).toHaveLength(2);
    expect(received[0].to).toEqual(['sam@x.org']);
    expect(received[0].raw).toContain('Hi Sam');
    expect(received[1].raw).toContain('Hi Alex');
    expect(received[0].raw).toMatch(/List-Unsubscribe: <mailto:stop@example\.org\?subject=unsubscribe>/i);
    expect(received[0].raw).toMatch(/Reply-To: help@example\.org/i);

    const again = await b.sendAll({ transport, recipients: people, config, templates, logPath, delayMs: 0 });
    expect(again).toMatchObject({ sent: 0, skippedAlreadySent: 2 });
    expect(received).toHaveLength(2);

    const more = await b.sendAll({ transport, recipients: [...people, { email: 'new@x.org', first_name: 'New' }], config, templates, logPath, delayMs: 0 });
    expect(more).toMatchObject({ sent: 1, skippedAlreadySent: 2 });
    expect(received).toHaveLength(3);
  });

  it('stops straight away when the mail server says a sending limit was reached, and resumes later', async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bc-'));
    const logPath = path.join(tmp, 'log.csv');
    const three = [...people, { email: 'third@x.org', first_name: 'Third' }];
    const { received, transport } = await startServer({ rejectOn: 'alex@x.org' });

    const s = await b.sendAll({ transport, recipients: three, config, templates, logPath, delayMs: 0 });
    expect(s.sent).toBe(1);
    expect(s.failed).toBe(1);
    expect(s.stoppedBecause).toMatch(/limit/i);
    expect(s.remaining).toBe(2);
    expect(received.map((m) => m.to[0])).toEqual(['sam@x.org']); // the third person was NOT attempted
    expect([...b.readSentEmails(logPath)]).toEqual(['sam@x.org']);
  });

  it('respects the per-run cap', async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bc-'));
    const { received, transport } = await startServer();
    const s = await b.sendAll({ transport, recipients: people, config, templates, logPath: path.join(tmp, 'l.csv'), max: 1, delayMs: 0 });
    expect(s.sent).toBe(1);
    expect(s.stoppedBecause).toMatch(/per-run limit/);
    expect(received).toHaveLength(1);
  });
});

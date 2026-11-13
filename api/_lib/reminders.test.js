import { describe, it, expect, afterEach } from 'vitest';
import { createRequire } from 'module';
import { createRemindersHandler, createUnsubscribeHandler, buildReminderEmail, unsubscribeToken, ukDate } from './reminders.js';

const require = createRequire(import.meta.url);
const { SMTPServer } = require('smtp-server');

const BASE = 'https://proj.supabase.co';
const DBSECRET = 'db-secret-value';
const A = '11111111-1111-1111-1111-111111111111';
const B = '22222222-2222-2222-2222-222222222222';
const C = '33333333-3333-3333-3333-333333333333';
const person = (id, over = {}) => ({ participant_id: id, email: `${id.slice(0, 2)}@example.org`, name: 'Alex A.', team_name: 'Phoenix', week_number: 1, day_name: 'Monday', closes_at: '2026-11-16T20:00:00+00:00', ...over });

// ---- stand-in for the database functions the handler calls -----------------------------------------------
function fakeDb({ candidates = [], claimResult = () => true, candidatesOk = true } = {}) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const name = new URL(url).pathname.split('/').pop();
    const args = JSON.parse(init.body || '{}');
    calls.push({ name, args });
    const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
    if (args.p_secret !== DBSECRET) return json(400, { message: 'not authorised' });
    if (name === 'reminder_candidates') return candidatesOk ? json(200, candidates) : json(404, {});
    if (name === 'reminder_claim') return json(200, claimResult(args));
    if (name === 'reminder_release' || name === 'reminder_unsubscribe') return json(200, name === 'reminder_unsubscribe' ? true : null);
    return json(404, {});
  };
  return { fetchImpl, calls };
}
const makeRes = () => {
  const r = { code: 0, body: null, headers: {} };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.send = (b) => { r.body = b; return r; };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  return r;
};
const baseEnv = (port = 1) => ({
  CRON_SECRET: 'cron-secret', REMINDERS_ENABLED: 'true', REMINDER_DB_SECRET: DBSECRET,
  VITE_SUPABASE_URL: BASE, VITE_SUPABASE_ANON_KEY: 'anon',
  SMTP_HOST: '127.0.0.1', SMTP_PORT: String(port), SMTP_USER: 'notifications@example.org', SMTP_PASS: 'pw', SMTP_INSECURE: '1',
  SITE_URL: 'https://league.example.org',
});
const post = async (h, { token = 'cron-secret', body = { kind: 'closing' }, method = 'POST' } = {}) => {
  const res = makeRes();
  await h({ method, headers: token ? { authorization: `Bearer ${token}` } : {}, body }, res);
  return res;
};
const NOW = () => new Date('2026-11-16T18:30:00Z');

let server;
afterEach(async () => { if (server) await new Promise((r) => server.close(r)); server = null; });
async function startSmtp() {
  const received = [];
  server = new SMTPServer({
    authOptional: true, allowInsecureAuth: true, disabledCommands: ['STARTTLS'], onAuth: (a, s, cb) => cb(null, { user: a.username }),
    onData(stream, session, cb) { let raw = ''; stream.on('data', (c) => { raw += c.toString(); }); stream.on('end', () => { received.push({ to: session.envelope.rcptTo[0].address, raw }); cb(); }); },
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { received, port: server.server.address().port };
}

describe('send-reminders: who may call it and when it does nothing', () => {
  it('only accepts POST with the right cron secret', async () => {
    const { fetchImpl, calls } = fakeDb();
    const h = createRemindersHandler({ env: baseEnv(), fetchImpl, now: NOW });
    expect((await post(h, { method: 'GET' })).code).toBe(405);
    expect((await post(h, { token: null })).code).toBe(401);
    expect((await post(h, { token: 'wrong' })).code).toBe(401);
    expect(calls).toHaveLength(0);
  });
  it('does nothing at all unless REMINDERS_ENABLED is "true"', async () => {
    const { fetchImpl, calls } = fakeDb({ candidates: [person(A)] });
    const h = createRemindersHandler({ env: { ...baseEnv(), REMINDERS_ENABLED: 'false' }, fetchImpl, now: NOW });
    const r = await post(h);
    expect(r.code).toBe(200);
    expect(r.body.skipped).toBe(true);
    expect(calls).toHaveLength(0);
  });
  it('rejects an unknown kind and reports missing server settings', async () => {
    const { fetchImpl } = fakeDb();
    expect((await post(createRemindersHandler({ env: baseEnv(), fetchImpl, now: NOW }), { body: { kind: 'spam' } })).code).toBe(400);
    const incomplete = { ...baseEnv(), REMINDER_DB_SECRET: '' };
    expect((await post(createRemindersHandler({ env: incomplete, fetchImpl, now: NOW }))).code).toBe(503);
  });
  it('explains a failing database call instead of pretending nobody needs a reminder', async () => {
    const { fetchImpl } = fakeDb({ candidatesOk: false });
    const r = await post(createRemindersHandler({ env: baseEnv(), fetchImpl, now: NOW }));
    expect(r.code).toBe(500);
    expect(r.body.error).toMatch(/database script|secret/i);
  });
  it('a dry run lists counts and masked addresses and sends and claims nothing', async () => {
    const { fetchImpl, calls } = fakeDb({ candidates: [person(A), person(B)] });
    const r = await post(createRemindersHandler({ env: baseEnv(), fetchImpl, now: NOW }), { body: { kind: 'closing', dryRun: true } });
    expect(r.body).toMatchObject({ dryRun: true, wouldSend: 2, day: '2026-11-16' });
    expect(r.body.sample[0]).toMatch(/^.\*\*\*@/);
    expect(calls.map((c) => c.name)).toEqual(['reminder_candidates']);
  });
});

describe('send-reminders: sending', () => {
  it('sends one personalised email each with a signed unsubscribe link, claiming each person first', async () => {
    const { received, port } = await startSmtp();
    const { fetchImpl, calls } = fakeDb({ candidates: [person(A), person(B, { name: 'Bea B.' })] });
    const r = await post(createRemindersHandler({ env: baseEnv(port), fetchImpl, now: NOW }));
    expect(r.body).toMatchObject({ ok: true, sent: 2, failed: 0, skipped: 0, remaining: 0 });
    expect(received).toHaveLength(2);
    const mail = received.find((m) => m.raw.includes('Hi Alex'));
    expect(mail.raw).toMatch(/Subject: Last call: today's challenge closes at 8:00pm/i);
    expect(mail.raw).toContain(`u=${A}`);
    expect(mail.raw).toContain(`t=${unsubscribeToken(DBSECRET, A)}`);
    expect(mail.raw).toMatch(/List-Unsubscribe:\s*<https:\/\/league\.example\.org\/api\/unsubscribe/i); // long headers are wrapped onto the next line
    expect(calls.filter((c) => c.name === 'reminder_claim')).toHaveLength(2);
  });
  it('never sends to someone already claimed (a retry or a double run)', async () => {
    const { received, port } = await startSmtp();
    const { fetchImpl } = fakeDb({ candidates: [person(A), person(B)], claimResult: (a) => a.p_participant !== A });
    const r = await post(createRemindersHandler({ env: baseEnv(port), fetchImpl, now: NOW }));
    expect(r.body).toMatchObject({ sent: 1, skipped: 1 });
    expect(received).toHaveLength(1);
    expect(received[0].to).toBe('22@example.org'); // B was emailed; A, already claimed, was not
  });
  it('works through a long list in batches and says how many are left', async () => {
    const { received, port } = await startSmtp();
    const { fetchImpl } = fakeDb({ candidates: [person(A), person(B), person(C)] });
    const r = await post(createRemindersHandler({ env: baseEnv(port), fetchImpl, now: NOW }), { body: { kind: 'closing', batch: 2 } });
    expect(r.body).toMatchObject({ sent: 2, remaining: 1 });
    expect(received).toHaveLength(2);
  });
  it('releases the claim when an email fails, carries on with the others, and does not leak internals', async () => {
    const { fetchImpl, calls } = fakeDb({ candidates: [person(A), person(B)] });
    const sentTo = [];
    const flaky = () => ({ sendMail: async (m) => { if (m.to.startsWith('11')) throw new Error('smtp down'); sentTo.push(m.to); }, close() {} });
    const r = await post(createRemindersHandler({ env: baseEnv(), fetchImpl, makeTransport: flaky, now: NOW }));
    expect(r.body).toMatchObject({ sent: 1, failed: 1 });
    expect(JSON.stringify(r.body)).not.toMatch(/smtp down/);
    const rel = calls.filter((c) => c.name === 'reminder_release');
    expect(rel).toHaveLength(1);
    expect(rel[0].args.p_participant).toBe(A);
    expect(sentTo).toHaveLength(1);
  });
  it('asks the database about the UK date, including the evening after midnight UTC in summer', () => {
    expect(ukDate(new Date('2026-11-16T18:30:00Z'))).toBe('2026-11-16');
    expect(ukDate(new Date('2026-07-01T23:30:00Z'))).toBe('2026-07-02'); // 00:30 in the UK
  });
});

describe('reminder email content', () => {
  const args = { name: 'Alex A.', weekNumber: 2, dayName: 'Tuesday', closesAt: '2026-11-24T20:00:00+00:00', siteUrl: 'https://x.org', unsubscribeUrl: 'https://x.org/api/unsubscribe?u=1&t=2' };
  it('closing and live wording, UK clock time, and an unsubscribe link in both parts', () => {
    const c = buildReminderEmail({ kind: 'closing', ...args });
    expect(c.subject).toBe("Last call: today's challenge closes at 8:00pm");
    expect(c.text).toContain('Week 2, Tuesday');
    expect(c.text).toContain(args.unsubscribeUrl);
    expect(c.html).toContain(args.unsubscribeUrl.replace(/&/g, '&amp;'));
    expect(buildReminderEmail({ kind: 'live', ...args }).subject).toBe("Today's challenge is live");
  });
  it('escapes HTML in names', () => {
    expect(buildReminderEmail({ kind: 'closing', ...args, name: '<i>Sam</i>' }).html).toContain('&lt;i&gt;Sam&lt;/i&gt;');
  });
  it('summer time shows the right local time', () => {
    expect(buildReminderEmail({ kind: 'closing', ...args, closesAt: '2026-07-01T19:00:00+00:00' }).subject).toContain('8:00pm'); // BST
  });
});

describe('unsubscribe page', () => {
  const env = { REMINDER_DB_SECRET: DBSECRET, VITE_SUPABASE_URL: BASE, VITE_SUPABASE_ANON_KEY: 'anon' };
  const good = { u: A, t: unsubscribeToken(DBSECRET, A) };
  const hit = async (h, method, params) => { const res = makeRes(); await h({ method, query: method === 'GET' ? params : {}, body: method === 'POST' ? params : undefined }, res); return res; };

  it('rejects links with a wrong or borrowed token', async () => {
    const { fetchImpl, calls } = fakeDb();
    const h = createUnsubscribeHandler({ env, fetchImpl });
    expect((await hit(h, 'GET', { u: A, t: 'nope' })).code).toBe(400);
    expect((await hit(h, 'POST', { u: B, t: good.t })).code).toBe(400); // token made for someone else
    expect((await hit(h, 'POST', { u: 'x', t: good.t })).code).toBe(400);
    expect(calls).toHaveLength(0);
  });
  it('GET only shows a button (so mail scanners that open links cannot unsubscribe anyone)', async () => {
    const { fetchImpl, calls } = fakeDb();
    const r = await hit(createUnsubscribeHandler({ env, fetchImpl }), 'GET', good);
    expect(r.code).toBe(200);
    expect(r.body).toContain('Yes, stop the reminders');
    expect(calls).toHaveLength(0);
  });
  it('POST with a valid token switches reminders off for exactly that person', async () => {
    const { fetchImpl, calls } = fakeDb();
    const r = await hit(createUnsubscribeHandler({ env, fetchImpl }), 'POST', good);
    expect(r.code).toBe(200);
    expect(r.body).toContain('Reminders stopped');
    expect(calls).toEqual([{ name: 'reminder_unsubscribe', args: { p_secret: DBSECRET, p_participant: A } }]);
  });
  it('shows a friendly error if the database call fails', async () => {
    const failing = async () => ({ ok: false, status: 500, json: async () => ({}) });
    const r = await hit(createUnsubscribeHandler({ env, fetchImpl: failing }), 'POST', good);
    expect(r.code).toBe(500);
    expect(r.body).toContain('reply to the email');
  });
});

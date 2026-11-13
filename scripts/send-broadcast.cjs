#!/usr/bin/env node
// Sends the league announcement email to a list of people, one personalised email each, through the SMTP
// mailbox set in email/.env. SAFE BY DEFAULT: with no flags it only checks the list and writes a preview.
//
//   node --env-file=email/.env scripts/send-broadcast.cjs --list email/recipients.csv                 (dry run)
//   node --env-file=email/.env scripts/send-broadcast.cjs --list email/recipients.csv --test-to you@x.org
//   node --env-file=email/.env scripts/send-broadcast.cjs --list email/recipients.csv --send
//
// See email/README.md for the full walkthrough.
'use strict';
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const nodemailer = require('nodemailer');
const b = require('./lib/broadcast.cjs');

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 && args[i + 1] ? args[i + 1] : fallback; };
const root = path.resolve(__dirname, '..');
const rel = (p) => path.resolve(process.cwd(), p);
const die = (msg) => { console.error(`\n✖ ${msg}\n`); process.exit(1); };

async function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); resolve(a.trim()); }));
}

function makeTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_INSECURE } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) die('Missing SMTP settings. Fill in email/.env (see email/README.md).');
  const port = Number(SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: SMTP_HOST, port,
    secure: port === 465,
    ...(SMTP_INSECURE ? { secure: false, ignoreTLS: true } : {}), // local testing only
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 20000, socketTimeout: 30000,
  });
}

async function main() {
  const listPath = opt('list');
  if (!listPath) die('Tell me which list to use: --list email/recipients.csv');
  if (!fs.existsSync(rel(listPath))) die(`List not found: ${listPath}`);

  const config = JSON.parse(fs.readFileSync(opt('config') ? rel(opt('config')) : path.join(root, 'email/announcement.config.json'), 'utf8'));
  const templates = {
    html: fs.readFileSync(path.join(root, 'email/announcement.html'), 'utf8'),
    text: fs.readFileSync(path.join(root, 'email/announcement.txt'), 'utf8'),
  };
  const suppressed = opt('suppress') ? b.loadSuppressed(b.parseCsv(fs.readFileSync(rel(opt('suppress')), 'utf8'))) : new Set();
  const { recipients, invalid, duplicates, suppressed: nSuppressed } =
    b.loadRecipients(b.parseCsv(fs.readFileSync(rel(listPath), 'utf8')), { suppressed });
  const logPath = rel(opt('log', 'email/sent-log.csv'));
  const alreadySent = b.readSentEmails(logPath);
  const pending = recipients.filter((r) => !alreadySent.has(r.email));
  const perHour = Number(opt('per-hour', 100));
  const max = Number(opt('max', 200));
  const placeholders = b.findPlaceholders(config);

  console.log('\n── Announcement check ──────────────────────────────');
  console.log(`People in the list (valid, unique): ${recipients.length}`);
  console.log(`  already sent in an earlier run:   ${alreadySent.size ? recipients.length - pending.length : 0}`);
  console.log(`  still to send:                    ${pending.length}`);
  console.log(`Skipped: ${invalid.length} invalid address(es), ${duplicates} duplicate(s), ${nSuppressed} on the do-not-email list`);
  if (invalid.length) console.log(`  invalid: ${invalid.slice(0, 8).join(', ')}${invalid.length > 8 ? ' …' : ''}`);
  console.log(`Pace: about ${perHour} emails/hour (one every ${(b.delayForRate(perHour) / 1000).toFixed(1)}s); at most ${max} per run`);
  const hours = pending.length / perHour;
  console.log(`Estimated time for the rest: ${hours < 1 ? Math.ceil(hours * 60) + ' minutes' : hours.toFixed(1) + ' hours'}`);
  if (placeholders.length) console.log(`\n⚠ Not filled in yet in email/announcement.config.json: ${placeholders.join(', ')}`);

  if (!recipients.length) die('There is nobody to send to.');

  // Always write a preview so you can look at exactly what people will get.
  const sample = b.buildMessage(recipients[0], config, templates);
  fs.writeFileSync(path.join(root, 'email/preview.html'), sample.html);
  console.log(`\nSubject: ${sample.subject}\nPreview written to email/preview.html (open it in a browser).`);

  const testTo = opt('test-to');
  if (!testTo && !flag('send')) {
    console.log('\nThis was a DRY RUN: nothing was sent. Next: --test-to you@example.org, then --send.\n');
    return;
  }
  if (placeholders.length) die('Fill in every value in email/announcement.config.json before sending anything.');

  const transport = makeTransport();
  try { await transport.verify(); } catch (e) { die(`Could not sign in to the mail server: ${e.message}`); }
  console.log('✔ Connected to the mail server and signed in.');

  if (testTo) {
    for (const to of testTo.split(',').map((x) => x.trim()).filter(Boolean)) {
      if (!b.isValidEmail(to)) die(`Not a valid address: ${to}`);
      await transport.sendMail(b.buildMessage({ email: to, first_name: 'Test' }, config, templates, { test: true }));
      console.log(`✔ Test email sent to ${to}`);
    }
    console.log('\nCheck it on a phone and in the spam folder. Then run again with --send.\n');
    return;
  }

  const answer = await confirm(`\nAbout to email ${Math.min(pending.length, max)} real people from ${config.from_email}.\nType SEND ${Math.min(pending.length, max)} to continue: `);
  if (answer !== `SEND ${Math.min(pending.length, max)}`) die('Cancelled. Nothing was sent.');

  const summary = await b.sendAll({
    transport, recipients, config, templates, logPath, perHour, max,
    onProgress: (p) => console.log(`${p.status === 'sent' ? '✔' : '✖'} ${p.index}/${p.total} ${p.email}${p.error ? '  ' + p.error : ''}`),
  });
  console.log(`\nDone. Sent ${summary.sent}, failed ${summary.failed}, ${summary.remaining} still to send.`);
  if (summary.stoppedBecause) console.log(`Stopped early: ${summary.stoppedBecause}. Wait, then run the same command again: it continues where it stopped and never emails anyone twice.`);
  console.log(`Log: ${logPath}\n`);
}

main().catch((e) => die(e.message));

// Core logic for the announcement sender (scripts/send-broadcast.cjs). Kept free of I/O side effects where
// possible so it can be unit-tested, including against a local fake SMTP server.
'use strict';
const fs = require('fs');

// ---------- CSV -----------------------------------------------------------------------------------------
// Minimal RFC 4180 parser: quoted fields, escaped quotes (""), commas and newlines inside quotes, CRLF, BOM.
function parseCsv(text) {
  const src = String(text).replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/[\s-]+/g, '_'));
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}

const EMAIL_RE = /^[^\s@,;<>()"]+@[^\s@,;<>()"]+\.[^\s@,;<>()"]{2,}$/;
const isValidEmail = (e) => EMAIL_RE.test(e) && e.length <= 254;

// ---------- Recipients ----------------------------------------------------------------------------------
function loadRecipients(rows, { suppressed = new Set() } = {}) {
  const seen = new Set();
  const recipients = [], invalid = [];
  let duplicates = 0, suppressedCount = 0;
  for (const r of rows) {
    const email = (r.email || r.e_mail || r.email_address || '').trim().toLowerCase();
    if (!isValidEmail(email)) { invalid.push(email || '(blank)'); continue; }
    if (suppressed.has(email)) { suppressedCount++; continue; }
    if (seen.has(email)) { duplicates++; continue; }
    seen.add(email);
    const first = (r.first_name || r.firstname || r.name || '').trim().split(/\s+/)[0];
    recipients.push({ email, first_name: first || 'there', type: (r.type || r.role || '').toLowerCase() });
  }
  return { recipients, invalid, duplicates, suppressed: suppressedCount };
}

const loadSuppressed = (rows) =>
  new Set(rows.map((r) => (r.email || '').trim().toLowerCase()).filter(Boolean));

// ---------- Templates -----------------------------------------------------------------------------------
const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// {{name}} placeholders. Throws on an unknown one, so a typo can never be sent out as "{{video_urll}}".
function renderTemplate(tpl, vars, { html = false } = {}) {
  return tpl.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, key) => {
    if (!(key in vars)) throw new Error(`Template uses {{${key}}} but no value was provided for it`);
    return html ? escapeHtml(vars[key]) : String(vars[key]);
  });
}

// Anything still saying TODO (or in [square brackets]) has not been filled in yet.
const findPlaceholders = (config) =>
  Object.entries(config).filter(([k, v]) => k !== 'deadline' && /TODO|\[[^\]]*\]/.test(String(v))).map(([k]) => k);

function buildMessage(recipient, config, templates, { test = false } = {}) {
  const vars = {
    ...config,
    first_name: test ? 'Test' : recipient.first_name,
    deadline_sentence: config.deadline ? `Please register by ${config.deadline}. ` : '',
  };
  return {
    from: { name: config.from_name, address: config.from_email },
    to: recipient.email,
    replyTo: config.reply_to || config.from_email,
    subject: (test ? '[TEST] ' : '') + renderTemplate(config.subject, vars),
    text: renderTemplate(templates.text, vars),
    html: renderTemplate(templates.html, vars, { html: true }),
    headers: {
      'List-Unsubscribe': `<mailto:${config.unsubscribe_email}?subject=unsubscribe>`,
    },
  };
}

// ---------- Pacing + resume log --------------------------------------------------------------------------
const delayForRate = (perHour) => Math.ceil(3600000 / Math.max(1, perHour));

function readSentEmails(logPath) {
  if (!fs.existsSync(logPath)) return new Set();
  const sent = new Set();
  for (const line of fs.readFileSync(logPath, 'utf8').split(/\r?\n/)) {
    const [email, status] = line.split(',');
    if (status === 'sent') sent.add(email.trim().toLowerCase());
  }
  return sent;
}
const appendLog = (logPath, email, status, detail = '') =>
  fs.appendFileSync(logPath, `${email},${status},${new Date().toISOString()},${String(detail).replace(/[\r\n,]+/g, ' ').slice(0, 160)}\n`);

const looksRateLimited = (err) =>
  /limit|quota|too many|rate|throttl|exceed/i.test(`${err.response || ''} ${err.message || ''}`) ||
  [421, 450, 451, 452, 454].includes(err.responseCode);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Sending --------------------------------------------------------------------------------------
async function sendAll({ transport, recipients, config, templates, logPath, perHour = 100, max = 200, delayMs, onProgress = () => {} }) {
  const wait = delayMs ?? delayForRate(perHour);
  const alreadySent = readSentEmails(logPath);
  const todo = recipients.filter((r) => !alreadySent.has(r.email));
  const summary = { sent: 0, failed: 0, skippedAlreadySent: recipients.length - todo.length, remaining: 0, stoppedBecause: null };
  let consecutiveFailures = 0;

  for (let i = 0; i < todo.length; i++) {
    if (summary.sent >= max) { summary.stoppedBecause = `reached the per-run limit of ${max}`; break; }
    const r = todo[i];
    try {
      await transport.sendMail(buildMessage(r, config, templates));
      appendLog(logPath, r.email, 'sent');
      summary.sent++; consecutiveFailures = 0;
      onProgress({ index: i + 1, total: todo.length, email: r.email, status: 'sent' });
    } catch (err) {
      appendLog(logPath, r.email, 'failed', err.response || err.message);
      summary.failed++; consecutiveFailures++;
      onProgress({ index: i + 1, total: todo.length, email: r.email, status: 'failed', error: err.response || err.message });
      if (looksRateLimited(err)) { summary.stoppedBecause = 'the mail server says a sending limit was reached'; break; }
      if (consecutiveFailures >= 3) { summary.stoppedBecause = '3 failures in a row'; break; }
    }
    if (i < todo.length - 1 && wait > 0) await sleep(wait);
  }
  summary.remaining = Math.max(0, todo.length - summary.sent);
  return summary;
}

module.exports = {
  parseCsv, isValidEmail, loadRecipients, loadSuppressed, renderTemplate, findPlaceholders,
  buildMessage, delayForRate, readSentEmails, appendLog, looksRateLimited, sendAll, escapeHtml,
};

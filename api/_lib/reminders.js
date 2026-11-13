// Email reminders, sent by a scheduled GitHub Actions job calling POST /api/send-reminders.
//
//  closing: 6:30pm, "closes at 8pm", only people who have NOT submitted today's challenge
//  live:    morning, "today's challenge is live" (off until you add a schedule for it)
//
// SAFETY: nothing here can reach your data without the secrets in the server's environment:
//  - CRON_SECRET (GitHub -> this function) and REMINDER_DB_SECRET (this function -> the database functions, which
//    store only its hash). There is no powerful database key anywhere.
//  - REMINDERS_ENABLED must be "true", otherwise the function does nothing. Merging this code cannot start emails.
//  - Each person is "claimed" in the database before an email is sent, so a retry or a double run can never send twice,
//    and the claim is released if sending fails.
//  - Every email has a one-tap unsubscribe link, signed so it can only switch off the person it was made for.
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DEFAULT_SITE = 'https://connect-talent-league-2026.vercel.app';

// ---------- small helpers ---------------------------------------------------------------------------------
export const unsubscribeToken = (secret, participantId) =>
  crypto.createHmac('sha256', String(secret)).update(String(participantId)).digest('hex');

const sameSecret = (a, b) => {
  const h = (x) => crypto.createHash('sha256').update(String(x)).digest();
  return crypto.timingSafeEqual(h(a), h(b));
};
export const ukDate = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(d); // YYYY-MM-DD
const clock = (iso) =>
  new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Europe/London' })
    .format(new Date(iso)).replace(/\s/g, '').toLowerCase(); // "8:00pm"
const maskEmail = (e) => String(e).replace(/^(.).*(@.*)$/, '$1***$2');
const siteOf = (env) => String(env.SITE_URL || DEFAULT_SITE).replace(/\/+$/, '');

// ---------- the emails ------------------------------------------------------------------------------------
export function buildReminderEmail({ kind, name, weekNumber, dayName, closesAt, siteUrl, unsubscribeUrl }) {
  const first = String(name || '').trim().split(/\s+/)[0] || 'there';
  const until = clock(closesAt);
  const which = `Week ${weekNumber}, ${dayName}`;
  const closing = kind === 'closing';
  const subject = closing ? `Last call: today's challenge closes at ${until}` : "Today's challenge is live";
  const lead = closing
    ? `You haven't sent today's challenge yet (${which}). It closes at ${until} tonight.`
    : `Today's challenge is open (${which}). You have until ${until} tonight.`;
  const how = 'It takes about 5 to 15 minutes: type your answer, record a voice note, or send a photo. If you have already done it today, thank you, and you can ignore this email.';
  const footer = `Connect Talent CIO, registered charity 1169975. You are receiving this because you joined the Connect Talent League. To stop these reminders: ${unsubscribeUrl}`;
  const text = [`Hi ${first},`, '', lead, '', how, '', `Open the league: ${siteUrl}`, '', 'Thank you,', 'Connect Talent CIO', '', '--', footer].join('\n');
  const html = `<!doctype html><html lang="en"><body style="margin:0;background:#f3f4f8;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;">
<tr><td style="background:${closing ? '#b45309' : '#0a2558'};padding:18px 24px;color:#fff;font-size:20px;font-weight:bold;">${esc(subject)}</td></tr>
<tr><td style="padding:24px;font-size:16px;line-height:1.55;">
<p style="margin:0 0 14px;">Hi ${esc(first)},</p><p style="margin:0 0 14px;">${esc(lead)}</p><p style="margin:0 0 14px;">${esc(how)}</p>
<p style="text-align:center;margin:20px 0;"><a href="${esc(siteUrl)}" style="background:#6d28d9;color:#fff;text-decoration:none;font-weight:bold;padding:14px 26px;border-radius:12px;display:inline-block;">Open today's challenge</a></p>
<p style="margin:0;">Thank you,<br>Connect Talent CIO</p></td></tr>
<tr><td style="padding:14px 24px;background:#f8fafc;font-size:12px;line-height:1.5;color:#64748b;">Connect Talent CIO, registered charity 1169975. You are receiving this because you joined the Connect Talent League. <a href="${esc(unsubscribeUrl)}" style="color:#64748b;">Stop these reminders</a>.</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}

function defaultTransport(env) {
  const port = Number(env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: env.SMTP_HOST, port, secure: port === 465,
    ...(env.SMTP_INSECURE ? { secure: false, ignoreTLS: true } : {}), // local testing only
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    pool: true, maxConnections: 3, connectionTimeout: 10000, socketTimeout: 15000,
  });
}

// ---------- POST /api/send-reminders ----------------------------------------------------------------------
export function createRemindersHandler({ env = process.env, fetchImpl = fetch, makeTransport = defaultTransport, now = () => new Date() } = {}) {
  return async function handler(req, res) {
    const reply = (code, body) => res.status(code).json(body);
    if (req.method !== 'POST') { res.setHeader?.('Allow', 'POST'); return reply(405, { error: 'Method not allowed' }); }

    const token = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
    if (!env.CRON_SECRET || !token || !sameSecret(token, env.CRON_SECRET)) return reply(401, { error: 'Unauthorised' });
    if (env.REMINDERS_ENABLED !== 'true') return reply(200, { skipped: true, reason: 'Reminders are switched off (REMINDERS_ENABLED is not "true").' });

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const kind = body?.kind;
    if (!['closing', 'live'].includes(kind)) return reply(400, { error: 'kind must be "closing" or "live".' });

    const base = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
    const anon = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
    if (!base || !anon || !env.REMINDER_DB_SECRET || !env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
      return reply(503, { error: 'Reminders are not fully set up on the server yet.' });
    }

    const day = ukDate(now());
    const rpc = (name, args) => fetchImpl(`${base}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_secret: env.REMINDER_DB_SECRET, ...args }),
    });

    try {
      const cand = await rpc('reminder_candidates', { p_kind: kind, p_day: day });
      if (!cand.ok) return reply(500, { error: 'Could not read the reminder list. Has the latest database script been run, and the reminder secret set?' });
      const list = await cand.json();

      if (body.dryRun === true || body.dryRun === 'true') {
        return reply(200, { dryRun: true, kind, day, wouldSend: list.length, sample: list.slice(0, 5).map((p) => maskEmail(p.email)) });
      }

      const batch = Math.min(Math.max(parseInt(body.batch, 10) || 20, 1), 40);
      const todo = list.slice(0, batch);
      const transport = makeTransport(env);
      const siteUrl = siteOf(env);
      const out = { ok: true, kind, day, sent: 0, failed: 0, skipped: 0, remaining: list.length - todo.length };

      const sendOne = async (p) => {
        const claim = await rpc('reminder_claim', { p_kind: kind, p_day: day, p_participant: p.participant_id });
        if (!claim.ok || (await claim.json()) !== true) { out.skipped += 1; return; }
        const unsubscribeUrl = `${siteUrl}/api/unsubscribe?u=${p.participant_id}&t=${unsubscribeToken(env.REMINDER_DB_SECRET, p.participant_id)}`;
        const mail = buildReminderEmail({ kind, name: p.name, weekNumber: p.week_number, dayName: p.day_name, closesAt: p.closes_at, siteUrl, unsubscribeUrl });
        try {
          await transport.sendMail({
            from: { name: env.SMTP_FROM_NAME || 'Connect Talent CIO', address: env.SMTP_FROM || env.SMTP_USER },
            to: p.email, replyTo: env.SMTP_REPLY_TO || env.SMTP_FROM || env.SMTP_USER,
            headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` }, ...mail,
          });
          out.sent += 1;
        } catch (err) {
          console.error('reminder email failed:', err.message);
          out.failed += 1;
          await rpc('reminder_release', { p_kind: kind, p_day: day, p_participant: p.participant_id });
        }
      };

      // a few at a time, so a batch finishes well inside the function's time limit
      const queue = [...todo];
      await Promise.all(Array.from({ length: Math.min(5, queue.length) }, async () => {
        while (queue.length) await sendOne(queue.shift());
      }));
      transport.close?.();
      return reply(200, out);
    } catch (err) {
      console.error('reminders error:', err.message);
      return reply(500, { error: 'Something went wrong. Please try again.' });
    }
  };
}

// ---------- GET/POST /api/unsubscribe ---------------------------------------------------------------------
const page = (title, bodyHtml) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title></head>
<body style="margin:0;background:#f3f4f8;font-family:Arial,Helvetica,sans-serif;color:#1e293b;"><div style="max-width:480px;margin:48px auto;padding:0 16px;">
<div style="background:#fff;border-radius:16px;padding:28px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.08);"><h1 style="font-size:22px;color:#0a2558;margin:0 0 12px;">${esc(title)}</h1>${bodyHtml}
<p style="font-size:12px;color:#64748b;margin:20px 0 0;">Connect Talent CIO, registered charity 1169975</p></div></div></body></html>`;

export function createUnsubscribeHandler({ env = process.env, fetchImpl = fetch } = {}) {
  return async function handler(req, res) {
    const send = (code, html) => {
      res.setHeader?.('Content-Type', 'text/html; charset=utf-8');
      res.setHeader?.('Cache-Control', 'no-store');
      return res.status(code).send(html);
    };
    if (!['GET', 'POST'].includes(req.method)) { res.setHeader?.('Allow', 'GET, POST'); return send(405, page('Not allowed', '<p>Please use the link in your email.</p>')); }

    const src = req.method === 'POST' && req.body && typeof req.body === 'object' ? req.body : (req.query || {});
    const id = String(src.u || ''), tok = String(src.t || '');
    const secret = env.REMINDER_DB_SECRET;
    const valid = secret && UUID.test(id) && tok && sameSecret(tok, unsubscribeToken(secret, id));
    if (!valid) return send(400, page('This link is not valid', '<p>It may be incomplete. Please use the link in the latest email we sent you, or reply to that email and we will switch them off for you.</p>'));

    // GET only shows a button, so mail scanners that pre-open links cannot unsubscribe anyone by accident
    if (req.method === 'GET') {
      return send(200, page('Stop reminder emails?', `<p>You will no longer get the daily challenge reminders. You can still take part in the league.</p>
<form method="POST" action="/api/unsubscribe"><input type="hidden" name="u" value="${esc(id)}"><input type="hidden" name="t" value="${esc(tok)}">
<button type="submit" style="background:#6d28d9;color:#fff;font-weight:bold;border:0;border-radius:12px;padding:14px 26px;font-size:16px;cursor:pointer;">Yes, stop the reminders</button></form>`));
    }

    const base = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
    const anon = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
    try {
      const r = await fetchImpl(`${base}/rest/v1/rpc/reminder_unsubscribe`, {
        method: 'POST', headers: { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_secret: secret, p_participant: id }),
      });
      if (!r.ok) throw new Error(`database said ${r.status}`);
      return send(200, page('Reminders stopped', '<p>You will not get any more daily reminder emails. Thank you for taking part!</p>'));
    } catch (err) {
      console.error('unsubscribe failed:', err.message);
      return send(500, page('Something went wrong', '<p>We could not switch the reminders off. Please reply to the email and we will do it for you.</p>'));
    }
  };
}

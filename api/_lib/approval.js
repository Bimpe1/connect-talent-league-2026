// "You're approved" email, sent when a facilitator approves a registration.
//
// SECURITY MODEL (this is a deployed endpoint, so it is deliberately strict):
//   - the caller must present a valid Supabase sign-in token AND be a facilitator (checked by the database)
//   - it can only email a participant who is ALREADY approved in the database, at the address stored on their
//     profile (the caller cannot supply an address or any text)
//   - each person is emailed at most once (claimed atomically in the database before sending)
//   - the mailbox password lives only in the server's environment variables, never in the browser or the repo
import nodemailer from 'nodemailer';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function buildApprovalEmail({ name, teamName, siteUrl }) {
  const first = String(name || '').trim().split(/\s+/)[0] || 'there';
  const forTeam = teamName ? ` for Team ${teamName}` : '';
  const subject = "You're approved for the Connect Talent League 2026";
  const steps = [
    `Open ${siteUrl} on your phone or computer.`,
    'Choose "Returning Sign-In" and enter this email address. We will send you a one-tap sign-in link (no password).',
    'If you are already signed in, tap "Check if I have been approved".',
  ];
  const how = [
    'Each weekday a short challenge (5 to 15 minutes) opens at 9:00am and closes at 8:00pm UK time.',
    'Team missions on Saturdays and reflections on Sundays stay open all day.',
    'Claim 10 bonus points each week for attending in person.',
  ];
  const footer = 'You are receiving this because you registered for the Connect Talent League with this email address. Connect Talent CIO, registered charity 1169975.';
  const text = [
    `Hi ${first},`, '',
    `Great news: a facilitator has approved your registration${forTeam}. You can start now!`, '',
    'WHAT TO DO NEXT', ...steps.map((x, i) => `${i + 1}. ${x}`), '',
    'HOW IT WORKS', ...how.map((x) => `- ${x}`), '',
    `Watch the one-minute guide: ${siteUrl}/video.html`, '',
    'Thank you,', 'Connect Talent CIO', '', '--', footer,
  ].join('\n');
  const html = `<!doctype html><html lang="en"><body style="margin:0;background:#f3f4f8;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;">
<tr><td style="background:#0a2558;padding:22px 24px;color:#fff;"><div style="font-size:13px;letter-spacing:1px;text-transform:uppercase;opacity:.8;">Connect Talent CIO</div><div style="font-size:24px;font-weight:bold;margin-top:6px;">You're approved!</div></td></tr>
<tr><td style="padding:24px;font-size:16px;line-height:1.55;">
<p style="margin:0 0 14px;">Hi ${esc(first)},</p>
<p style="margin:0 0 14px;">Great news: a facilitator has approved your registration${esc(forTeam)}. You can start now!</p>
<h2 style="font-size:18px;margin:20px 0 8px;color:#0a2558;">What to do next</h2>
<ol style="margin:0 0 14px;padding-left:22px;">${steps.map((x) => `<li style="margin-bottom:6px;">${esc(x)}</li>`).join('')}</ol>
<p style="text-align:center;margin:18px 0;"><a href="${esc(siteUrl)}" style="background:#6d28d9;color:#fff;text-decoration:none;font-weight:bold;padding:14px 26px;border-radius:12px;display:inline-block;">Open the league</a></p>
<h2 style="font-size:18px;margin:20px 0 8px;color:#0a2558;">How it works</h2>
<ul style="margin:0 0 14px;padding-left:22px;">${how.map((x) => `<li style="margin-bottom:6px;">${esc(x)}</li>`).join('')}</ul>
<p style="margin:0 0 14px;"><a href="${esc(siteUrl)}/video.html" style="color:#6d28d9;">Watch the one-minute guide</a></p>
<p style="margin:0;">Thank you,<br>Connect Talent CIO</p></td></tr>
<tr><td style="padding:16px 24px;background:#f8fafc;font-size:12px;line-height:1.5;color:#64748b;">${esc(footer)}</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}

function defaultTransport(env) {
  const port = Number(env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: env.SMTP_HOST, port, secure: port === 465,
    ...(env.SMTP_INSECURE ? { secure: false, ignoreTLS: true } : {}), // local testing only
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 10000, socketTimeout: 15000,
  });
}

export function createHandler({ env = process.env, fetchImpl = fetch, makeTransport = defaultTransport } = {}) {
  return async function handler(req, res) {
    const reply = (code, body) => res.status(code).json(body);

    if (req.method !== 'POST') { res.setHeader?.('Allow', 'POST'); return reply(405, { error: 'Method not allowed' }); }

    const base = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
    const anon = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
    const token = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
    if (!token) return reply(401, { error: 'Please sign in again.' });
    if (!base || !anon || !env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
      return reply(503, { error: 'Approval emails are not set up on the server yet.' });
    }

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const participantId = body?.participantId;
    if (!UUID.test(String(participantId || ''))) return reply(400, { error: 'A valid participant is required.' });

    const sb = (path, init = {}) =>
      fetchImpl(`${base}${path}`, { ...init, headers: { apikey: anon, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });

    try {
      // 1. a real signed-in user...
      const who = await sb('/auth/v1/user');
      if (!who.ok) return reply(401, { error: 'Please sign in again.' });
      // 2. ...who is a facilitator (the database decides, not the browser)
      const cap = await sb('/rest/v1/rpc/is_captain', { method: 'POST', body: '{}' });
      if (!cap.ok || (await cap.json()) !== true) return reply(403, { error: 'Only facilitators can send approval emails.' });

      // 3. the participant must exist and already be approved
      const q = await sb(`/rest/v1/profiles?id=eq.${participantId}&select=id,name,email,team_name,role,status,approval_emailed_at`);
      if (!q.ok) return reply(500, { error: 'Could not look this person up. Has the latest database script been run?' });
      const p = (await q.json())[0];
      if (!p) return reply(404, { error: 'Participant not found.' });
      if (p.role !== 'participant' || p.status !== 'approved') return reply(409, { error: 'That person has not been approved yet.' });
      if (p.approval_emailed_at) return reply(200, { ok: true, alreadySent: true });

      // 4. claim it atomically so two clicks can never send two emails
      const claim = await sb(`/rest/v1/profiles?id=eq.${participantId}&approval_emailed_at=is.null`, {
        method: 'PATCH', headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ approval_emailed_at: new Date().toISOString() }),
      });
      if (!claim.ok) return reply(500, { error: 'Could not record the email. Has the latest database script been run?' });
      if (!(await claim.json()).length) return reply(200, { ok: true, alreadySent: true });

      // 5. send; if it fails, release the claim so the facilitator can try again
      const siteUrl = String(env.SITE_URL || 'https://connect-talent-league-2026.vercel.app').replace(/\/+$/, '');
      const mail = buildApprovalEmail({ name: p.name, teamName: p.team_name, siteUrl });
      try {
        await makeTransport(env).sendMail({
          from: { name: env.SMTP_FROM_NAME || 'Connect Talent CIO', address: env.SMTP_FROM || env.SMTP_USER },
          to: p.email, replyTo: env.SMTP_REPLY_TO || env.SMTP_FROM || env.SMTP_USER, ...mail,
        });
      } catch (err) {
        console.error('approval email failed:', err.message);
        await sb(`/rest/v1/profiles?id=eq.${participantId}`, { method: 'PATCH', body: JSON.stringify({ approval_emailed_at: null }) });
        return reply(502, { error: 'The email could not be sent. Please try again, or tell them yourself.' });
      }
      return reply(200, { ok: true });
    } catch (err) {
      console.error('approval email error:', err.message);
      return reply(500, { error: 'Something went wrong. Please try again.' });
    }
  };
}

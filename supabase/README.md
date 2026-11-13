# Supabase setup (about 10 minutes)

1. Create a project at supabase.com (free tier is fine).
2. **SQL Editor -> New query**, paste `supabase/schema.sql`, Run.
3. **Project Settings -> API**: copy the Project URL and `anon` public key into `.env.local`
   (see `.env.example`). Add the same two variables in Vercel (Project Settings -> Environment Variables).
4. **Authentication -> URL Configuration**: set *Site URL* to your Vercel URL and add it (plus `http://localhost:5173`) to *Redirect URLs* so magic links land back in the app. Vercel preview URLs need adding too if you use them (e.g. `https://*-your-team.vercel.app/**`).
   `http://localhost:5173` to *Redirect URLs* so magic links land back in the app.
5. **Authentication -> Providers -> Email**: keep "Enable Email provider" on. Passwords are not used.
6. **Authentication -> SMTP Settings** (recommended): plug in your SMTP provider (Resend, Brevo, ...).
   Supabase's built-in sender is limited to a few emails per hour, which is not enough for a cohort.
7. **Create each facilitator's account**, then promote them. The *Returning Sign-In* tab deliberately does not
   create accounts (a mistyped email would otherwise create a stray one), so either:
   - Authentication -> Users -> **Invite user** (enter their email; they click the link to sign in), or
   - have them enrol as a participant once (promote them afterwards).

   Then, in the SQL editor:

```sql
update public.profiles set role = 'captain', status = 'approved', name = 'Coach Morgan', team_name = 'Staff', team_id = null
where email = 'coach@example.com';
```
   Promoted captains don't appear on the leaderboard or in team counts.
8. **Storage** needs no setup: `schema.sql` creates a private `evidence` bucket (2 MB per file) for photos,
   drawings and voice notes, with per-user folders. Check it exists under Storage.
9. Edit the **Confirm signup** and **Magic Link** email templates (Authentication -> Email Templates) so the
   wording suits participants. New users get the first, returning users the second.

## Registration approval
New sign-ups start as **pending**. After opening their email link they see a "waiting for approval" screen, and
the database blocks them from submitting or uploading anything until a captain approves them (Captain Dashboard,
**Approvals** tab; there is also "Approve All"). Rejecting someone frees their display name.
Pending people do not appear on the leaderboard. Captains do not need approval.

## Approval emails ("You're approved")
When a facilitator clicks **Approve** (or **Approve All**), the person gets an email telling them they can start and how
to sign in. This is sent by a small server function (`api/notify-approved.js`), not by the browser, and it is strict:
it only works for a signed-in **facilitator**, only for someone **already approved**, only to the address saved on their
profile, and **at most once per person**. If the email cannot be sent, the approval is still saved and the facilitator
is told, so they can let the person know themselves. Rejections send no email.

**Setup** (Vercel, Project Settings, Environment Variables; set for Production, mark the password as *Sensitive*,
then redeploy):

| Name | Value |
|---|---|
| `SMTP_HOST` | `box5186.bluehost.com` (or your mail server) |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | the mailbox address, e.g. `notifications@connect-talent.org` |
| `SMTP_PASS` | that mailbox's password |
| `SMTP_FROM_NAME` | optional, defaults to `Connect Talent CIO` |
| `SMTP_REPLY_TO` | optional, defaults to the mailbox address |
| `SITE_URL` | optional, defaults to `https://connect-talent-league-2026.vercel.app` |

Run the latest `schema.sql` first: it adds the `approval_emailed_at` column that stops anyone being emailed twice.
The existing `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` variables are reused. To try it on your computer use
`vercel dev` (the normal `npm run dev` does not run server functions). Use the same mailbox as the sign-in emails: it is
already known to deliver.

## Things to know
- **There is no limit on team size.** Anyone can join the team of their choice; team scores use a per-member average so
  teams of different sizes compete fairly.
- Participants can claim **In-Person Attendance** once per week (any day of a started week, not limited to the
  09:00-20:00 window). A captain approves it, which adds the 10 TP bonus. The score is fixed by the database.
- Each challenge can be submitted once per participant.

## Time-gated challenges
Daily challenges (Mon-Fri) open at **09:00** and close at **20:00 UK time** on their date. Saturday team
missions and Sunday reflections stay open. Participants can read a challenge early but can only submit
while it is open. This is enforced by a database trigger using the server clock (changing a phone's clock
does nothing); the on-screen lock and countdown are convenience only.

Captains change it in the dashboard under **Schedule**: default open/close times, a global on/off switch, and
per-day overrides (open all day, locked, or custom hours). It is stored in `league_config.schedule`.
`schema.sql` is safe to re-run on an existing project to add this feature. Season dates come from
`start_date` (Monday of week 1, default 2026-11-16).

## After week 4
Delete personal data: `truncate public.profiles cascade;`, remove the users under
Authentication -> Users, and empty the `evidence` bucket under Storage (or simply delete the project).

## Known follow-ups
- The rubric score is a client-side keyword check (`src/lib/scoring.js`), not AI. Captains review every score.
- A participant sets the suggested score for a normal challenge from the browser; the captain's approval is the
  real check. (Attendance claims are fixed at 10 by the database.)

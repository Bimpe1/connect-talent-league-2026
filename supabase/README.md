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
7. Sign in once through the app with each facilitator's email, then promote them:

```sql
update public.profiles set role = 'captain', team_name = 'Staff'
where email = 'coach@example.com';
```

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
Delete personal data: `truncate public.profiles cascade;` then remove the users under
Authentication -> Users (or delete the project).

## Known follow-ups
- Photos/voice notes are still stored as base64 text in `submissions`; move to Supabase Storage.
- The "AI" rubric score is still a client-side keyword check (see `evaluateRubricWithAi`).

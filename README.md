# Connect Talent League 2026

A 4-week gamified skills league: participants complete daily challenges, captains (facilitators)
review and approve them, and a leaderboard ranks individuals and teams.

**Stack:** React 18, Vite, Tailwind CSS, Supabase (Auth magic links + Postgres with Row Level Security).

## Getting started
```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev
```
Backend setup (database, auth, SMTP, creating captains): see [`supabase/README.md`](supabase/README.md).
Without the two env vars the app shows a "Supabase isn't configured" notice.

## Scripts
| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build into `dist/` |
| `npm run lint` | ESLint (React + hooks rules) |
| `npm test` | Vitest unit tests (scoring and points logic) |
| `npm run format` | Prettier on `src/` |

CI (`.github/workflows/ci.yml`) runs lint, tests and a build on every push.

## Project layout
- `src/App.jsx` – session, data loading and action handlers
- `src/lib/api.js` – all Supabase calls + mapping to the shapes the UI uses
- `src/lib/scoring.js` – first-pass rubric check (keyword heuristic, **not AI**; captains review every score)
- `src/lib/points.js` – league-points maths (weekly points + 10 per attended session, per-member team average)
- `src/components/` – views (participant, leaderboard, badges, captain dashboard) and modals
- `src/data/curriculum.js` – default 4-week challenge pack and teams
- `supabase/schema.sql` – tables, RLS policies, triggers, leaderboard view

## Privacy
Emails are collected with consent, visible only to captains (RLS), never included in the leaderboard,
and should be deleted after the programme (see `supabase/README.md`).

## Deploying (Vercel)
`vercel.json` provides the SPA fallback (all routes serve `index.html`). In Vercel, set
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Project Settings -> Environment Variables
(then redeploy). Add your Vercel URL to Supabase -> Authentication -> URL Configuration
(Site URL and Redirect URLs) so magic links return to the deployed app.

-- Connect Talent League 2026 — Supabase schema
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run (idempotent where practical).

-- ---------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,                       -- private: captains only (see RLS + leaderboard view)
  name        text not null,
  kind        text not null default 'learner' check (kind in ('learner','volunteer')),
  role        text not null default 'participant' check (role in ('participant','captain')),
  team_id     text,
  team_name   text,
  attendance  jsonb not null default '{"prep":true,"wk1":false,"wk2":false,"wk3":false,"wk4":false}',
  badges      text[] not null default '{ready_to_begin}',
  created_at  timestamptz not null default now()
);
create unique index if not exists profiles_name_unique on public.profiles (lower(trim(name)));

create table if not exists public.submissions (
  id                uuid primary key default gen_random_uuid(),
  participant_id    uuid not null references public.profiles(id) on delete cascade,
  participant_name  text not null,
  team_name         text,
  week_number       int  not null check (week_number between 1 and 4),
  challenge_day     text,
  challenge_title   text,
  submission_text   text,
  media_type        text,
  attached_voice    text,
  attached_media    text,
  ai_score          jsonb not null,                 -- {attempt,reason,evidence,conclusion,total,notes}
  ai_notes          text,
  type              text not null default 'Daily Challenge',
  status            text not null default 'pending' check (status in ('pending','approved')),
  approved_by       text,
  approved_at       timestamptz,
  created_at        timestamptz not null default now(),
  constraint ai_total_range check ((ai_score->>'total')::int between 0 and 20)
);
create index if not exists submissions_participant_idx on public.submissions (participant_id);

-- Single-row table holding the (captain-editable) curriculum. NULL = use built-in default.
create table if not exists public.league_config (
  id     int primary key default 1 check (id = 1),
  weeks  jsonb
);
insert into public.league_config (id, weeks) values (1, null) on conflict do nothing;

-- ---------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------
create or replace function public.is_captain() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'captain');
$$;

-- Hard team capacity limits (per the official pack; 40 places). Enforced here, not just in the UI,
-- so two people racing for the last place can't both get it.
create or replace function public.team_capacity(tid text) returns int
language sql immutable as $$
  select case tid
    when 'phoenix' then 6 when 'vision' then 5 when 'unity' then 6 when 'hope' then 6
    when 'spark' then 5 when 'talent_stars' then 6 when 'bridge' then 6 else null end;
$$;

-- Create a profile for every new auth user. Role is ALWAYS 'participant' here;
-- promote captains manually (see bottom of file). Metadata comes from the sign-up form.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  tid text := new.raw_user_meta_data->>'team_id';
  cap int  := public.team_capacity(tid);
begin
  if tid is not null and cap is null then
    raise exception 'Unknown team';
  end if;
  if cap is not null then
    perform pg_advisory_xact_lock(hashtext('team:' || tid));  -- serialise concurrent sign-ups per team
    if (select count(*) from public.profiles where team_id = tid and role = 'participant') >= cap then
      raise exception 'Team is full';
    end if;
  end if;
  insert into public.profiles (id, email, name, kind, team_id, team_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data->>'kind' = 'volunteer' then 'volunteer' else 'learner' end,
    new.raw_user_meta_data->>'team_id',
    new.raw_user_meta_data->>'team_name'
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Fill participant_name/team_name server-side so they can't be forged.
create or replace function public.submissions_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select name, team_name into new.participant_name, new.team_name
  from public.profiles where id = new.participant_id;
  return new;
end $$;

drop trigger if exists submissions_before_insert on public.submissions;
create trigger submissions_before_insert before insert on public.submissions
  for each row execute function public.submissions_before_insert();

-- Award "first_step" on a participant's first submission.
create or replace function public.submissions_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
     set badges = array_append(badges, 'first_step')
   where id = new.participant_id and not ('first_step' = any(badges));
  return new;
end $$;

drop trigger if exists submissions_after_insert on public.submissions;
create trigger submissions_after_insert after insert on public.submissions
  for each row execute function public.submissions_after_insert();

-- Stamp approval time/approver server-side.
create or replace function public.submissions_before_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and old.status <> 'approved' then
    new.approved_at := now();
    select name into new.approved_by from public.profiles where id = auth.uid();
  end if;
  return new;
end $$;

drop trigger if exists submissions_before_update on public.submissions;
create trigger submissions_before_update before update on public.submissions
  for each row execute function public.submissions_before_update();

-- ---------------------------------------------------------------
-- Leaderboard view: public-safe fields only (NO email). Points are DERIVED from
-- approved submissions, so scores can never drift from the approval queue.
-- Runs with owner rights so participants can see everyone's totals.
-- ---------------------------------------------------------------
create or replace view public.leaderboard as
select
  p.id, p.name, p.kind as role, p.team_id as "teamId", p.team_name as "teamName",
  p.attendance, p.badges,
  coalesce(sum((s.ai_score->>'total')::int) filter (where s.week_number = 1), 0)::int as wk1,
  coalesce(sum((s.ai_score->>'total')::int) filter (where s.week_number = 2), 0)::int as wk2,
  coalesce(sum((s.ai_score->>'total')::int) filter (where s.week_number = 3), 0)::int as wk3,
  coalesce(sum((s.ai_score->>'total')::int) filter (where s.week_number = 4), 0)::int as wk4
from public.profiles p
left join public.submissions s on s.participant_id = p.id and s.status = 'approved'
where p.role = 'participant'
group by p.id;

revoke all on public.leaderboard from anon;
grant select on public.leaderboard to authenticated;

-- ---------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.submissions   enable row level security;
alter table public.league_config enable row level security;

-- profiles: read own, captains read all. Only captains may update (attendance, badges).
-- Participants have NO update/insert/delete, so nobody can self-promote to captain.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_captain());

drop policy if exists profiles_update_captain on public.profiles;
create policy profiles_update_captain on public.profiles for update
  using (public.is_captain()) with check (public.is_captain());

-- submissions
drop policy if exists submissions_select on public.submissions;
create policy submissions_select on public.submissions for select
  using (participant_id = auth.uid() or public.is_captain());

drop policy if exists submissions_insert on public.submissions;
create policy submissions_insert on public.submissions for insert
  with check (participant_id = auth.uid() and status = 'pending'
              and not public.is_captain());

drop policy if exists submissions_update_captain on public.submissions;
create policy submissions_update_captain on public.submissions for update
  using (public.is_captain()) with check (public.is_captain());
-- no delete policy => nobody can delete (audit trail)

-- league_config: everyone signed in can read, captains write
drop policy if exists config_select on public.league_config;
create policy config_select on public.league_config for select using (auth.role() = 'authenticated');
drop policy if exists config_update_captain on public.league_config;
create policy config_update_captain on public.league_config for update
  using (public.is_captain()) with check (public.is_captain());

-- Team seat counts for the enrolment screen (works before login, exposes counts only).
create or replace function public.team_counts() returns table (team_id text, n bigint)
language sql stable security definer set search_path = public as $$
  select team_id, count(*) from public.profiles where role = 'participant' group by team_id;
$$;
grant execute on function public.team_counts() to anon, authenticated;

-- ---------------------------------------------------------------
-- Time-gated challenges
-- Each daily challenge is open between release_time and close_time (UK time by default) on its
-- calendar date. Saturday (team mission) and Sunday (reflection) stay open (ungated_days).
-- Captains can edit all of this from the dashboard ("Schedule"), stored in league_config.schedule:
--   gating        false = nothing is time-gated
--   start_date    Monday of week 1
--   overrides     {"2026-11-17": {"mode":"open"|"locked"|"custom","release_time":"HH:MM","close_time":"HH:MM"}}
-- ---------------------------------------------------------------
alter table public.league_config add column if not exists schedule jsonb not null default
  '{"gating":true,"start_date":"2026-11-16","release_time":"09:00","close_time":"20:00","timezone":"Europe/London","ungated_days":["Saturday","Sunday"],"overrides":{}}';

alter table public.league_config drop constraint if exists schedule_times_valid;
alter table public.league_config add constraint schedule_times_valid check (
  schedule->>'release_time' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  and schedule->>'close_time' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  and (schedule->>'start_date') ~ '^\d{4}-\d{2}-\d{2}$'
);

-- Server clock, so the app never trusts the device's clock.
create or replace function public.server_now() returns timestamptz
language sql stable as $$ select now(); $$;
grant execute on function public.server_now() to authenticated;

-- One row per challenge day (4 weeks x 7 days) with its opening/closing instants.
create or replace function public.challenge_windows()
returns table (week_number int, day_name text, day_date date, opens_at timestamptz,
               closes_at timestamptz, ungated boolean, locked boolean)
language sql stable security definer set search_path = public as $$
  with cfg as (select schedule as s from public.league_config where id = 1),
  days as (
    select w as wk, d as idx, c.s,
           (c.s->>'start_date')::date + ((w - 1) * 7 + d) as dt,
           (array['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'])[d + 1] as dname
    from cfg c, generate_series(1, 4) w, generate_series(0, 6) d
  )
  select wk, dname, dt,
         ((dt::text || ' ' || coalesce(o->>'release_time', s->>'release_time'))::timestamp at time zone (s->>'timezone')),
         ((dt::text || ' ' || coalesce(o->>'close_time',   s->>'close_time'))::timestamp   at time zone (s->>'timezone')),
         -- coalesce: a NULL here (no override) would make `not ungated` NULL and silently skip the gate
         coalesce(coalesce((s->>'gating')::boolean, true) = false
                  or (s->'ungated_days') ? dname
                  or o->>'mode' = 'open', false),
         coalesce(o->>'mode' = 'locked', false)
  from days
  cross join lateral (select s->'overrides'->(dt::text) as o) ov
  order by wk, idx;
$$;
grant execute on function public.challenge_windows() to authenticated;

-- Enforce the window on every submission (the UI lock is only a convenience).
create or replace function public.submissions_gate() returns trigger
language plpgsql security definer set search_path = public as $$
declare w record;
begin
  select * into w from public.challenge_windows() cw
   where cw.week_number = new.week_number and cw.day_name = new.challenge_day;
  if not found then
    raise exception 'Unknown challenge day';
  end if;
  if w.locked then
    raise exception 'This challenge is locked by your captain.';
  end if;
  if not w.ungated and now() < w.opens_at then
    raise exception 'This challenge has not opened yet.';
  end if;
  if not w.ungated and now() > w.closes_at then
    raise exception 'This challenge has closed.';
  end if;
  return new;
end $$;

drop trigger if exists submissions_gate on public.submissions;
create trigger submissions_gate before insert on public.submissions
  for each row execute function public.submissions_gate();

-- ---------------------------------------------------------------
-- Make someone a Captain (run manually AFTER they have signed in once):
--   update public.profiles set role = 'captain', team_name = 'Staff'
--   where email = 'coach@example.com';
-- ---------------------------------------------------------------

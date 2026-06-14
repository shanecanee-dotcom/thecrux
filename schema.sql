-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- It creates the two tables that store each user's data and locks them down
-- with Row Level Security so users can only touch their own rows.

-- ── profiles ─────────────────────────────────────────────────────────────────
-- One row per user: their profile card, goals, app tweaks, and onboarding flag.
create table if not exists public.profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  profile_data jsonb    not null default '{}'::jsonb,
  goals        jsonb    not null default '{}'::jsonb,
  tweaks       jsonb    not null default '{}'::jsonb,
  onboarded    boolean  not null default false,
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users manage own profile" on public.profiles
  for all to authenticated
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── sessions ─────────────────────────────────────────────────────────────────
-- One row per climbing session. The full session JSON (including climbs[])
-- is stored in the `data` column so the schema stays flexible.
create table if not exists public.sessions (
  id         text        primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  data       jsonb       not null,
  updated_at timestamptz not null default now()
);

alter table public.sessions enable row level security;

create policy "Users manage own sessions" on public.sessions
  for all to authenticated
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

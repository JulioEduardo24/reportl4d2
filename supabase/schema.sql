-- ReportL4D2 schema
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query).

create extension if not exists "pgcrypto";

-- Steam users that have logged in at least once.
create table if not exists public.profiles (
  steam_id text primary key,
  persona_name text not null,
  avatar_url text,
  profile_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);

-- Reports filed against a (possibly unregistered) Steam player.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reported_steam_id text not null,
  reported_profile_url text not null,
  category text not null default 'other',
  reason text not null,
  reporter_steam_id text not null references public.profiles(steam_id) on delete set null,
  status text not null default 'pending', -- pending | reviewed | dismissed
  created_at timestamptz not null default now()
);

create index if not exists reports_reported_steam_id_idx on public.reports (reported_steam_id);
create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_status_idx on public.reports (status);

-- Row Level Security.
-- Public can read everything (the home feed and player pages must work
-- without logging in). All writes go through Next.js Route Handlers using
-- the Supabase service-role key (after we verify the Steam OpenID session
-- ourselves), so no anon/authenticated INSERT/UPDATE/DELETE policy is
-- defined on purpose - that key bypasses RLS entirely server-side.
alter table public.profiles enable row level security;
alter table public.reports enable row level security;

create policy "Public read access to profiles"
  on public.profiles for select
  using (true);

create policy "Public read access to reports"
  on public.reports for select
  using (true);

-- Suggested report categories (kept as a simple check constraint instead of
-- a separate table to keep things easy to extend from the SQL editor).
alter table public.reports
  drop constraint if exists reports_category_check;
alter table public.reports
  add constraint reports_category_check
  check (category in ('cheating', 'troll', 'other'));

alter table public.reports
  drop constraint if exists reports_status_check;
alter table public.reports
  add constraint reports_status_check
  check (status in ('pending', 'reviewed', 'dismissed'));

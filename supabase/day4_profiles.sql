-- Day 4 schema for TrackMyLife public profiles
-- Run this in Supabase SQL Editor once.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,30}$')
);

create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

-- Backfill existing users where possible (email prefix normalized).
insert into public.profiles (user_id, username, is_public)
select
  u.id,
  regexp_replace(lower(split_part(coalesce(u.email, ''), '@', 1)), '[^a-z0-9_]', '', 'g') as username,
  false
from auth.users u
where
  coalesce(u.email, '') <> ''
  and regexp_replace(lower(split_part(u.email, '@', 1)), '[^a-z0-9_]', '', 'g') ~ '^[a-z0-9_]{3,30}$'
on conflict (user_id) do nothing;

alter table public.profiles enable row level security;

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.username = lower(new.username);
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

drop policy if exists "profiles_select_public_or_own" on public.profiles;
create policy "profiles_select_public_or_own"
on public.profiles
for select
using (is_public = true or auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Day 7 schema for TrackMyLife explore feed
-- Run this in Supabase SQL Editor once.
--
-- Aggregates activity for public profiles so /explore can rank "who is
-- actively logging" in one round trip, instead of pulling every public
-- user's entries into the API route and reducing them in JS.

create or replace function public.explore_public_profiles(
  result_limit int default 30,
  result_offset int default 0
)
returns table (
  username text,
  entries_last_7 int,
  total_entries int,
  last_entry_date date,
  avg_score_last_7 numeric,
  recent_days json
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.username,
    count(e.id) filter (where e.entry_date > current_date - 7)::int as entries_last_7,
    count(e.id)::int as total_entries,
    max(e.entry_date) as last_entry_date,
    round(avg(e.score) filter (where e.entry_date > current_date - 7), 1) as avg_score_last_7,
    coalesce(
      json_agg(
        json_build_object('date', e.entry_date, 'score', e.score)
        order by e.entry_date
      ) filter (where e.entry_date > current_date - 7),
      '[]'::json
    ) as recent_days
  from public.profiles p
  join public.daily_entries e on e.user_id = p.user_id
  where p.is_public = true
    -- Future-dated rows would otherwise win "last active" forever. One day of
    -- slack, because entry dates are the user's local day and current_date is UTC.
    and e.entry_date <= current_date + 1
  group by p.username
  -- Dormant profiles fall out of the feed entirely.
  having max(e.entry_date) > current_date - 30
  order by
    count(e.id) filter (where e.entry_date > current_date - 7) desc,
    max(e.entry_date) desc,
    p.username asc
  limit least(greatest(result_limit, 1), 60)
  offset greatest(result_offset, 0);
$$;

-- The function is security definer (it reads daily_entries, which is RLS'd to
-- the owning user). Only the server-side API route may call it, so no direct
-- PostgREST access from browsers.
revoke all on function public.explore_public_profiles(int, int) from public;
revoke all on function public.explore_public_profiles(int, int) from anon;
revoke all on function public.explore_public_profiles(int, int) from authenticated;
grant execute on function public.explore_public_profiles(int, int) to service_role;

-- Day 9 schema: the weekly priority becomes up to 3 points, and the per-day
-- "update on your priority" is replaced by one end-of-week recap.
-- Run this in Supabase SQL Editor once. Safe to re-run (idempotent).

-- 1. Priority points.
-- No column change: weekly_priorities.priority now stores up to three points in
-- the same "- one per line" format daily notes use (see parseNotePoints in
-- dashboard-helpers.ts), so every existing single-line priority already reads
-- back as a one-point priority. Nothing to migrate.

-- 2. The weekly recap: what actually happened, against what was aimed for.
-- Written on/after Sunday for the week that just ended, so it hangs off that
-- week's row rather than off any single day.
alter table public.weekly_priorities add column if not exists recap text;

comment on column public.weekly_priorities.recap is
  'End-of-week recap: actual progress vs the priority that was set. Written on or after the Sunday that closes the week.';


-- ---------------------------------------------------------------------------
-- OPTIONAL, DESTRUCTIVE - read before running.
--
-- daily_entries.priority_update (the old per-day textbox) is no longer read or
-- written by the app. The column is left in place so existing updates are not
-- lost. Nothing below runs unless you uncomment it.
--
-- Step A folds each week's daily updates into that week's recap, oldest first,
-- so past updates stay visible in the new UI. It only fills recaps that are
-- still empty, so it is safe to re-run, and it does not touch weeks you have
-- already recapped by hand.
--
-- Run step A, check the recaps read the way you want, and only then run step B.
-- Step B cannot be undone.
-- ---------------------------------------------------------------------------

-- Step A - backfill old daily updates into the weekly recap:
--
-- update public.weekly_priorities as wp
-- set recap = folded.text
-- from (
--   select
--     inner_wp.id,
--     string_agg(
--       to_char(de.entry_date, 'Dy DD Mon') || ': ' || btrim(de.priority_update),
--       E'\n' order by de.entry_date
--     ) as text
--   from public.weekly_priorities as inner_wp
--   join public.daily_entries as de
--     on de.user_id = inner_wp.user_id
--    and de.entry_date >= inner_wp.week_start
--    and de.entry_date < inner_wp.week_start + 7
--   where de.priority_update is not null
--     and btrim(de.priority_update) <> ''
--   group by inner_wp.id
-- ) as folded
-- where wp.id = folded.id
--   and (wp.recap is null or btrim(wp.recap) = '');

-- Step B - drop the retired column once you are happy with step A:
--
-- alter table public.daily_entries drop column if exists priority_update;

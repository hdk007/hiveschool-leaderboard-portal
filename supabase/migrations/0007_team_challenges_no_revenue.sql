-- =============================================================================
-- HiveSchool Leaderboard Portal — 0007  Scoring model rework
-- -----------------------------------------------------------------------------
-- Changes:
--   1. Daily-challenge scores are now awarded to TEAMS (not individual
--      students) via a new `team_challenge_scores` table.
--   2. Students no longer generate revenue, and individual challenge scores no
--      longer feed the student ranking. A student's score is now based purely
--      on assignments + attendance.
--   3. A team's points = sum of its active students' scores  +  the team's
--      daily-challenge points.
--
-- NON-DESTRUCTIVE: keeps all existing tables/rows. The now-unused columns
-- (students.revenue_generated, students.challenge_score, settings.revenue_weight,
-- settings.challenge_weight) are retained but zeroed and ignored by the engine.
--
-- SAFE TO RUN ON THE LIVE DATABASE. Paste into the Supabase SQL Editor and Run.
-- Every UPDATE/DELETE is qualified with a WHERE clause for the `safeupdate`
-- extension (see migration 0006).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. New table: team_challenge_scores  (challenge → team → score)
-- ---------------------------------------------------------------------------
create table if not exists public.team_challenge_scores (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references public.daily_challenges(id) on delete cascade,
  team_id       uuid not null references public.teams(id) on delete cascade,
  score         numeric(12,2) not null default 0,
  created_at    timestamptz not null default now(),
  unique (challenge_id, team_id)
);

create index if not exists idx_team_challenge_scores_challenge on public.team_challenge_scores (challenge_id);
create index if not exists idx_team_challenge_scores_team on public.team_challenge_scores (team_id);

-- ---------------------------------------------------------------------------
-- 2. Teams gain a `challenge_points` column (maintained by the engine) so the
--    UI can show the student-vs-challenge breakdown of a team's total.
-- ---------------------------------------------------------------------------
alter table public.teams add column if not exists challenge_points numeric(12,2) not null default 0;

-- ---------------------------------------------------------------------------
-- 3. Re-point the ranking weights: assignments + attendance only (sum = 1.0).
--    revenue_weight / challenge_weight kept at 0 so the existing CHECK
--    constraint (sum of all four = 1.0) still holds.
-- ---------------------------------------------------------------------------
update public.leaderboard_settings
   set assignment_weight = 0.600,
       attendance_weight = 0.400,
       revenue_weight    = 0.000,
       challenge_weight  = 0.000
 where id is not null;

-- ---------------------------------------------------------------------------
-- 4. Rewrite the engine.
-- ---------------------------------------------------------------------------
create or replace function public.recalculate_leaderboard()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  w_asg   numeric;
  w_att   numeric;
  max_asg numeric;
begin
  -- Latest weights (fall back to defaults if no settings row exists).
  select assignment_weight, attendance_weight
    into w_asg, w_att
  from public.leaderboard_settings
  order by updated_at desc
  limit 1;

  if w_asg is null then
    w_asg := 0.60; w_att := 0.40;
  end if;

  -- Normalise assignments against the active-cohort max (guard divide-by-zero).
  select coalesce(nullif(max(assignments_completed), 0), 1)
    into max_asg
  from public.students
  where status = 'active';

  -- Preserve previous student ranks for change indicators.
  update public.students set previous_rank = rank where id is not null;

  -- Student final score = assignments + attendance (normalised 0-100 blend).
  with scored_students as (
    select
      id,
      case
        when status = 'inactive' then 0
        else round(
            w_asg * (assignments_completed::numeric / max_asg * 100)
          + w_att * attendance_percentage
        , 2)
      end as score
    from public.students
  )
  update public.students s
     set final_score = sc.score
    from scored_students sc
   where s.id = sc.id;

  -- Rank active students.
  with ranked_students as (
    select id, rank() over (order by final_score desc, name asc) as new_rank
    from public.students
    where status = 'active'
  )
  update public.students s
     set rank = r.new_rank,
         growth_percentage = case
           when s.previous_rank is null or s.previous_rank = 0 then 0
           else round(((s.previous_rank - r.new_rank)::numeric / s.previous_rank) * 100, 2)
         end
    from ranked_students r
   where s.id = r.id;

  -- Inactive students: no rank.
  update public.students
     set rank = null, growth_percentage = 0
   where status = 'inactive';

  -- Preserve previous team ranks.
  update public.teams set previous_rank = rank where id is not null;

  -- Team total = sum(active student scores) + team daily-challenge points.
  with team_aggregates as (
    select
      t.id,
      coalesce(sum(case when s.status = 'active' then s.final_score else 0 end), 0) as student_points,
      coalesce(sum(case when s.status = 'active' then 1 else 0 end), 0) as agg_students
    from public.teams t
    left join public.students s on s.team_id = t.id
    group by t.id
  ),
  team_challenges as (
    select team_id, coalesce(sum(score), 0) as challenge_points
    from public.team_challenge_scores
    group by team_id
  )
  update public.teams t
     set challenge_points = coalesce(tc.challenge_points, 0),
         total_points     = ta.student_points + coalesce(tc.challenge_points, 0),
         total_students   = ta.agg_students
    from team_aggregates ta
    left join team_challenges tc on tc.team_id = ta.id
   where t.id = ta.id;

  -- Re-rank teams by total points.
  with ranked_teams as (
    select id, rank() over (order by total_points desc, name asc) as new_rank
    from public.teams
  )
  update public.teams t
     set rank = rt.new_rank,
         growth_percentage = case
           when t.previous_rank is null or t.previous_rank = 0 then 0
           else round(((t.previous_rank - rt.new_rank)::numeric / t.previous_rank) * 100, 2)
         end
    from ranked_teams rt
   where t.id = rt.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Triggers: recompute when team challenge scores change; stop recomputing
--    on the now-unused student_challenge_scores table.
-- ---------------------------------------------------------------------------
create or replace function public.trg_team_challenge_scores_recalc()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() > 1 then
    return null;
  end if;
  perform public.recalculate_leaderboard();
  return null;
end;
$$;

drop trigger if exists trg_team_challenge_scores_recalc on public.team_challenge_scores;
create trigger trg_team_challenge_scores_recalc
  after insert or update or delete on public.team_challenge_scores
  for each statement
  execute function public.trg_team_challenge_scores_recalc();

-- Challenges no longer affect individual students.
drop trigger if exists trg_challenge_scores_recalc on public.student_challenge_scores;

-- ---------------------------------------------------------------------------
-- 6. RLS for the new table: public read, admin write.
-- ---------------------------------------------------------------------------
alter table public.team_challenge_scores enable row level security;

drop policy if exists "public_read_team_challenge_scores" on public.team_challenge_scores;
create policy "public_read_team_challenge_scores" on public.team_challenge_scores
  for select using (true);

drop policy if exists "admin_insert_team_challenge_scores" on public.team_challenge_scores;
create policy "admin_insert_team_challenge_scores" on public.team_challenge_scores
  for insert with check (public.is_admin());

drop policy if exists "admin_update_team_challenge_scores" on public.team_challenge_scores;
create policy "admin_update_team_challenge_scores" on public.team_challenge_scores
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_delete_team_challenge_scores" on public.team_challenge_scores;
create policy "admin_delete_team_challenge_scores" on public.team_challenge_scores
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 7. Realtime: broadcast team challenge score changes.
-- ---------------------------------------------------------------------------
alter table public.team_challenge_scores replica identity full;

do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.team_challenge_scores';
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- 8. Apply the new model to existing rows.
-- ---------------------------------------------------------------------------
select public.recalculate_leaderboard();

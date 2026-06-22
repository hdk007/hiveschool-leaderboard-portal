-- =============================================================================
-- HiveSchool Leaderboard Portal — 0006 Hotfix
-- Fix: recalculate_leaderboard() failed with SQLSTATE 21000
--      "UPDATE requires a WHERE clause" on projects that have the `safeupdate`
--      extension enabled.
--
-- The function ran three full-table UPDATE statements with no WHERE clause.
-- Because recalculate_leaderboard() is fired by AFTER-STATEMENT triggers on
-- students, teams and student_challenge_scores, EVERY insert/update/delete on
-- those tables aborted — which is why seeding and all admin writes failed and
-- the database stayed empty.
--
-- This patch re-creates the function with a `where id is not null` predicate on
-- each previously-unqualified UPDATE. The predicate is always true (id is the
-- primary key) so the behaviour is identical — it only satisfies safeupdate.
--
-- SAFE TO RUN ON A LIVE DATABASE: this only does CREATE OR REPLACE FUNCTION.
-- It does NOT drop or modify any table or data. Paste into the Supabase
-- SQL Editor and Run, then run `npm run seed` locally.
-- =============================================================================

create or replace function public.recalculate_leaderboard()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  w_rev   numeric;
  w_asg   numeric;
  w_att   numeric;
  w_chl   numeric;
  max_rev numeric;
  max_asg numeric;
  max_chl numeric;
begin
  -- Latest weights (fall back to the defaults if no settings row exists).
  select revenue_weight, assignment_weight, attendance_weight, challenge_weight
    into w_rev, w_asg, w_att, w_chl
  from public.leaderboard_settings
  order by updated_at desc
  limit 1;

  if w_rev is null then
    w_rev := 0.40; w_asg := 0.25; w_att := 0.20; w_chl := 0.15;
  end if;

  -- 1. Update each student's aggregated challenge_score from student_challenge_scores
  --    `where s.id is not null` is always true (id is the PK) but satisfies the
  --    `safeupdate` extension, which blocks UPDATEs with no WHERE clause.
  update public.students s
     set challenge_score = coalesce((
           select sum(score)
             from public.student_challenge_scores
            where student_id = s.id
         ), 0)
   where s.id is not null;

  -- Cohort maxima among active students (guard against divide-by-zero with nullif → coalesce).
  select
    coalesce(nullif(max(revenue_generated), 0), 1),
    coalesce(nullif(max(assignments_completed), 0), 1),
    coalesce(nullif(max(challenge_score), 0), 1)
  into max_rev, max_asg, max_chl
  from public.students
  where status = 'active';

  -- Preserve the current student ranks as previous_rank for change indicators.
  update public.students set previous_rank = rank where id is not null;

  -- Compute student final scores
  with scored_students as (
    select
      id,
      case
        when status = 'inactive' then 0
        else round(
            w_rev * (revenue_generated::numeric / max_rev * 100)
          + w_asg * (assignments_completed::numeric / max_asg * 100)
          + w_att * attendance_percentage
          + w_chl * (challenge_score::numeric / max_chl * 100)
        , 2)
      end as score
    from public.students
  )
  update public.students s
     set final_score = sc.score
    from scored_students sc
   where s.id = sc.id;

  -- Compute student ranks among active students
  with ranked_students as (
    select
      id,
      rank() over (order by final_score desc, name asc) as new_rank
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

  -- For inactive students, rank should be null, growth 0
  update public.students
     set rank = null,
         growth_percentage = 0
   where status = 'inactive';

  -- Now update teams
  -- Preserve the current team ranks as previous_rank for change indicators.
  update public.teams set previous_rank = rank where id is not null;

  -- Recalculate team total_points (sum of active student final_scores) and total_students count
  with team_aggregates as (
    select
      t.id,
      coalesce(sum(case when s.status = 'active' then s.final_score else 0 end), 0) as agg_points,
      coalesce(sum(case when s.status = 'active' then 1 else 0 end), 0) as agg_students
    from public.teams t
    left join public.students s on s.team_id = t.id
    group by t.id
  )
  update public.teams t
     set total_points = ta.agg_points,
         total_students = ta.agg_students
    from team_aggregates ta
   where t.id = ta.id;

  -- Re-rank teams based on total_points
  with ranked_teams as (
    select
      id,
      rank() over (order by total_points desc, name asc) as new_rank
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

-- =============================================================================
-- HiveSchool Leaderboard Portal — 0002 Functions & Triggers
-- The live leaderboard engine: score formula, ranking, auto-recompute, history.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- is_admin(): true when the current auth user is in public.admins.
-- SECURITY DEFINER so it can read public.admins regardless of the caller's RLS.
-- Used throughout RLS policies — keep it fast and side-effect free.
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins a where a.id = auth.uid()
  );
$$;

-- -----------------------------------------------------------------------------
-- set_updated_at(): generic trigger to maintain updated_at on row changes.
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Attach the updated_at trigger to every table that has the column.
do $$
declare
  t text;
begin
  foreach t in array array[
    'admins', 'students', 'leaderboard_settings', 'curriculum_modules',
    'announcements', 'weekly_challenges', 'achievements'
  ]
  loop
    execute format('drop trigger if exists trg_set_updated_at on public.%I;', t);
    execute format(
      'create trigger trg_set_updated_at before update on public.%I
       for each row execute function public.set_updated_at();', t
    );
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- recalculate_leaderboard()
-- The core ranking engine. Computes each student's final_score using the
-- configurable weights, then assigns ranks (1 = best). Metrics are normalised
-- to a 0–100 scale relative to the current cohort maxima so the weighted blend
-- is comparable:
--
--   final_score =  revenue_weight    * (revenue    / maxRevenue    * 100)
--                + assignment_weight * (assignments/ maxAssignments* 100)
--                + attendance_weight *  attendance_percentage        (already 0–100)
--                + challenge_weight  * (challenge  / maxChallenge  * 100)
--
-- previous_rank is preserved before re-ranking so the UI can show ▲ / ▼ change
-- indicators and rank-gain/loss animations.
--
-- SECURITY DEFINER so admins can invoke it via RPC and triggers can run it
-- without tripping RLS. Recursion (the UPDATE below re-firing the trigger) is
-- guarded by pg_trigger_depth() in the trigger function, not here.
-- -----------------------------------------------------------------------------
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
  -- Latest weights (fall back to the spec defaults if no settings row exists).
  select revenue_weight, assignment_weight, attendance_weight, challenge_weight
    into w_rev, w_asg, w_att, w_chl
  from public.leaderboard_settings
  order by updated_at desc
  limit 1;

  if w_rev is null then
    w_rev := 0.40; w_asg := 0.25; w_att := 0.20; w_chl := 0.15;
  end if;

  -- Cohort maxima (guard against divide-by-zero with nullif → coalesce).
  select
    coalesce(nullif(max(revenue_generated), 0), 1),
    coalesce(nullif(max(assignments_completed), 0), 1),
    coalesce(nullif(max(challenge_score), 0), 1)
  into max_rev, max_asg, max_chl
  from public.students;

  -- Preserve the current rank as previous_rank for change indicators.
  update public.students set previous_rank = rank where rank is not null;

  -- Compute scores + new ranks in one pass via a ranked CTE.
  with scored as (
    select
      s.id,
      round(
          w_rev * (s.revenue_generated::numeric     / max_rev * 100)
        + w_asg * (s.assignments_completed::numeric  / max_asg * 100)
        + w_att *  s.attendance_percentage
        + w_chl * (s.challenge_score::numeric        / max_chl * 100)
      , 2) as score
    from public.students s
  ),
  ranked as (
    select
      id,
      score,
      rank() over (order by score desc) as new_rank
    from scored
  )
  update public.students s
     set final_score = r.score,
         rank        = r.new_rank,
         -- Growth %: positive when the student climbed (lower rank number).
         growth_percentage = case
           when s.previous_rank is null or s.previous_rank = 0 then 0
           else round(((s.previous_rank - r.new_rank)::numeric / s.previous_rank) * 100, 2)
         end
    from ranked r
   where s.id = r.id;
end;
$$;

-- -----------------------------------------------------------------------------
-- snapshot_leaderboard(): persist the current standings into history.
-- Call on a schedule (e.g. weekly via pg_cron or an admin action) to power
-- weekly / monthly growth trends.
-- -----------------------------------------------------------------------------
create or replace function public.snapshot_leaderboard()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.leaderboard_history
    (student_id, rank, previous_rank, final_score, revenue_generated, attendance_percentage)
  select id, rank, previous_rank, final_score, revenue_generated, attendance_percentage
  from public.students;
end;
$$;

-- -----------------------------------------------------------------------------
-- Trigger plumbing: recompute the whole leaderboard whenever any ranking input
-- changes. Statement-level (runs once per statement, not per row) and guarded
-- against recursion via pg_trigger_depth().
-- -----------------------------------------------------------------------------
create or replace function public.trg_students_recalc()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Depth 1 = the user's original write. The recalc's own UPDATE fires this
  -- trigger again at depth 2 — skip it to avoid infinite recursion.
  if pg_trigger_depth() > 1 then
    return null;
  end if;
  perform public.recalculate_leaderboard();
  return null;
end;
$$;

drop trigger if exists trg_students_recalc on public.students;
create trigger trg_students_recalc
  after insert or update or delete on public.students
  for each statement
  execute function public.trg_students_recalc();

-- Recompute when the admin changes the weights, too.
create or replace function public.trg_settings_recalc()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalculate_leaderboard();
  return null;
end;
$$;

drop trigger if exists trg_settings_recalc on public.leaderboard_settings;
create trigger trg_settings_recalc
  after insert or update on public.leaderboard_settings
  for each statement
  execute function public.trg_settings_recalc();

-- Allow authenticated admins to trigger a manual recompute / snapshot via RPC.
grant execute on function public.recalculate_leaderboard() to authenticated, service_role;
grant execute on function public.snapshot_leaderboard() to authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated, service_role;

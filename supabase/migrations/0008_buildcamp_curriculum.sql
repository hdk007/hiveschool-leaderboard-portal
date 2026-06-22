-- =============================================================================
-- HiveSchool Leaderboard Portal — 0008  BuildCamp '26 curriculum
-- -----------------------------------------------------------------------------
-- Adds rich, admin-editable curriculum content:
--   • curriculum_modules gains `outcome` (the "you'll walk away with" line) and
--     `schedule` (a jsonb timeline of {time, title, detail}).
--   • new `mentors` table (the BuildCamp mentors).
--   • new `camp_info` single-row table (camp name, dates, logistics).
-- Then seeds the full BuildCamp '26 week (5 days), 6 mentors, and the camp info.
--
-- Everything here is read publicly and edited by admins in /admin/curriculum, and
-- pushed live via Realtime. SAFE on the live DB — every DELETE is WHERE-qualified
-- for the `safeupdate` extension. Paste into the Supabase SQL Editor and Run.
-- =============================================================================

-- 1. Extend curriculum_modules ------------------------------------------------
alter table public.curriculum_modules add column if not exists outcome  text;
alter table public.curriculum_modules add column if not exists schedule jsonb not null default '[]'::jsonb;

-- 2. Mentors ------------------------------------------------------------------
create table if not exists public.mentors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        text,
  bio         text,
  photo       text,
  order_index integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_mentors_order on public.mentors (order_index);

-- 3. Camp info (single row) ---------------------------------------------------
create table if not exists public.camp_info (
  id            uuid primary key default gen_random_uuid(),
  name          text not null default 'BuildCamp',
  subtitle      text,
  location      text,
  date_range    text,
  when_to_come  jsonb not null default '[]'::jsonb,
  what_to_bring jsonb not null default '[]'::jsonb,
  updated_at    timestamptz not null default now()
);

-- updated_at triggers for the new tables
do $$
declare t text;
begin
  foreach t in array array['mentors', 'camp_info']
  loop
    execute format('drop trigger if exists trg_set_updated_at on public.%I;', t);
    execute format('create trigger trg_set_updated_at before update on public.%I for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- 4. RLS: public read, admin write -------------------------------------------
alter table public.mentors   enable row level security;
alter table public.camp_info enable row level security;

do $$
declare t text;
begin
  foreach t in array array['mentors', 'camp_info']
  loop
    execute format('drop policy if exists "public_read_%1$s" on public.%1$s;', t);
    execute format('create policy "public_read_%1$s" on public.%1$s for select using (true);', t);
    execute format('drop policy if exists "admin_insert_%1$s" on public.%1$s;', t);
    execute format('create policy "admin_insert_%1$s" on public.%1$s for insert with check (public.is_admin());', t);
    execute format('drop policy if exists "admin_update_%1$s" on public.%1$s;', t);
    execute format('create policy "admin_update_%1$s" on public.%1$s for update using (public.is_admin()) with check (public.is_admin());', t);
    execute format('drop policy if exists "admin_delete_%1$s" on public.%1$s;', t);
    execute format('create policy "admin_delete_%1$s" on public.%1$s for delete using (public.is_admin());', t);
  end loop;
end $$;

-- 5. Realtime -----------------------------------------------------------------
alter table public.mentors   replica identity full;
alter table public.camp_info replica identity full;
do $$
declare t text;
begin
  foreach t in array array['mentors', 'camp_info']
  loop
    begin execute format('alter publication supabase_realtime add table public.%I;', t);
    exception when duplicate_object then null; when undefined_object then null; end;
  end loop;
end $$;

-- 6. Seed camp info -----------------------------------------------------------
delete from public.camp_info where id is not null;
insert into public.camp_info (name, subtitle, location, date_range, when_to_come, what_to_bring) values (
  'BuildCamp ''26',
  'Build a real venture in one week — from problem to pitch.',
  'HiveSchool Campus',
  '23–27 June 2026',
  '["Day 1 (Tue 23 Jun): report by 9:45 AM — the welcome starts at 10.", "Day 2 to Day 5: report by 10:50 AM. Each day runs to 6 PM."]'::jsonb,
  '["Your laptop and charger — a must, you build every day", "A water bottle", "A valid photo ID"]'::jsonb
);

-- 7. Seed the 5 BuildCamp days -----------------------------------------------
delete from public.curriculum_modules where id is not null;

insert into public.curriculum_modules (module_name, description, outcome, duration, order_index, completion_percentage, schedule) values
(
  'Find the Opportunity',
  'Get your team, then lock onto a real problem worth solving.',
  'A sharp problem, your customer, and a solution',
  'Day 1 · Tue 23 Jun', 1, 0,
  '[
    {"time":"10:00 AM","title":"Welcome & kickoff","detail":"Meet everyone, form your team, and see how the week works"},
    {"time":"11:00 AM","title":"Content Masterclass, with Dev","detail":"A content masterclass with Dev on making content people actually watch"},
    {"time":"12:15 PM","title":"Break","detail":""},
    {"time":"12:30 PM","title":"Lunch","detail":""},
    {"time":"1:00 PM","title":"The Framework, with Prabhu","detail":"The building blocks of a venture: the problem, your customer, research, the solution, and market size"},
    {"time":"3:00 PM","title":"Locked In: Building","detail":"Put it to work on your own idea, with mentors on the floor"},
    {"time":"5:15 PM","title":"Pitch your opportunity","detail":"Present your problem, customer and solution to the room"},
    {"time":"After 6 PM","title":"Buddy call, then Locked In Pro Max","detail":"Refine with your buddy and keep building"}
  ]'::jsonb
),
(
  'Build & Business',
  'Build a real product with AI and shape the business behind it.',
  'A live MVP and a one page business model',
  'Day 2 · Wed 24 Jun', 2, 0,
  '[
    {"time":"11:00 AM","title":"Idea to Execution, with Nikhil","detail":"Your business model, your competition, and the one feature to build first"},
    {"time":"12:45 PM","title":"Lunch","detail":""},
    {"time":"1:30 PM","title":"AI Tools","detail":"The AI toolkit and building live, the right tool for each job"},
    {"time":"3:00 PM","title":"Locked In: Building","detail":"Build your MVP with the tools"},
    {"time":"5:15 PM","title":"Ship the MVP","detail":"Every team demos a live MVP"},
    {"time":"After 6 PM","title":"Buddy call, then Locked In Pro Max","detail":"Review the build and keep going"}
  ]'::jsonb
),
(
  'Go to Market',
  'Learn marketing, then hit the street and sell for real.',
  'A go-to-market plan and your ad skit',
  'Day 3 · Thu 25 Jun', 3, 0,
  '[
    {"time":"11:00 AM","title":"GTM & Marketing 101, with Simar","detail":"Positioning, channels, and the real numbers behind marketing"},
    {"time":"1:00 PM","title":"Lunch","detail":""},
    {"time":"2:00 PM","title":"Sell on Street Challenge","detail":"Hit the streets and sell a real product to real people"},
    {"time":"3:15 PM","title":"Results announcement","detail":"Who sold the most, who pitched best"},
    {"time":"3:30 PM","title":"Locked In: Building","detail":"Build your ad and rehearse it as a skit"},
    {"time":"5:00 PM","title":"Ads Skit","detail":"Perform your ad live as a skit"},
    {"time":"After 6 PM","title":"Buddy call, then Locked In Pro Max","detail":"Polish the skit and keep going"}
  ]'::jsonb
),
(
  'Sell & Pitch Prep',
  'Learn to sell, then build your investor pitch deck.',
  'A first full pitch deck, built like a founder',
  'Day 4 · Fri 26 Jun', 4, 0,
  '[
    {"time":"11:00 AM","title":"Sales, with Saurabh","detail":"How to open, pitch, handle a no, and close, plus live mock pitches"},
    {"time":"1:00 PM","title":"Lunch","detail":""},
    {"time":"1:45 PM","title":"Pitch Deck: the VC Lens","detail":"The slides investors actually score, and what each must prove"},
    {"time":"2:30 PM","title":"Pitch Deck: the Craft, with Adhish","detail":"One idea per slide, the story, and how you deliver it"},
    {"time":"3:30 PM","title":"Break","detail":""},
    {"time":"3:45 PM","title":"Locked In: Building","detail":"Build your first full pitch deck"},
    {"time":"5:45 PM","title":"Wrap","detail":"Your mentor helps you finish and polish tomorrow"},
    {"time":"After 6 PM","title":"Buddy call, then Locked In Pro Max","detail":"Tighten the deck"}
  ]'::jsonb
),
(
  'Demo Day',
  'Polish, rehearse, and pitch to parents and judges.',
  'Your final pitch, delivered to parents and judges',
  'Day 5 · Sat 27 Jun', 5, 0,
  '[
    {"time":"11:00 AM","title":"The plan","detail":"Running order and the plan for Demo Day"},
    {"time":"11:15 AM","title":"Mentor pods","detail":"Your mentor helps your team finish and tighten the deck"},
    {"time":"1:15 PM","title":"Lunch","detail":""},
    {"time":"2:00 PM","title":"Rehearsals","detail":"Run your pitch, get notes, mic and screen checks"},
    {"time":"4:00 PM","title":"Doors open","detail":"Move to the amphitheatre, parents and judges seated"},
    {"time":"4:15 PM","title":"Demo Day pitches","detail":"Present your final pitch to parents and the judging panel"},
    {"time":"5:45 PM","title":"Awards & close","detail":"Winners, category awards, and a word to the families"},
    {"time":"6:00 PM","title":"Networking","detail":"Music and networking with the founders"}
  ]'::jsonb
);

-- 8. Seed mentors -------------------------------------------------------------
delete from public.mentors where id is not null;
insert into public.mentors (name, role, bio, order_index) values
('Nikhil Gaur',      'Founder, HiveSchool', 'Leads BuildCamp and the Idea to Execution masterclass.', 1),
('Simar',            'CMO, HiveSchool',     'Runs GTM & Marketing 101.', 2),
('Prabhu Guliani',   'Venture Framework',   'Built the 12-stage venture framework BuildCamp runs on. Ex-Growth, Libas.', 3),
('Dev Chopra',       'Content & Film',      'Filmmaker, host and content creator. Makes films, series, and ad films.', 4),
('Saurabh Sengupta', 'Sales',               'Former VP Sales, Zomato.', 5),
('Adhish Rane',      'Pitch & Story',       'Facilitator at Google.', 6);

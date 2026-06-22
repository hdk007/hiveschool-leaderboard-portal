-- =============================================================================
-- HiveSchool Leaderboard Portal — 0004 Storage Buckets & Policies
-- Public read on all asset buckets; only admins can upload / modify / delete.
-- =============================================================================

-- Create the buckets (public = true so the generated public URLs resolve).
insert into storage.buckets (id, name, public)
values
  ('student-images',      'student-images',      true),
  ('achievement-icons',   'achievement-icons',   true),
  ('curriculum-assets',   'curriculum-assets',   true),
  ('challenge-assets',    'challenge-assets',     true),
  ('announcement-assets', 'announcement-assets', true)
on conflict (id) do nothing;

-- Bucket list reused by the policies below.
-- Public read for every object in our buckets.
drop policy if exists "public_read_hive_assets" on storage.objects;
create policy "public_read_hive_assets" on storage.objects
  for select
  using (
    bucket_id in (
      'student-images', 'achievement-icons', 'curriculum-assets',
      'challenge-assets', 'announcement-assets'
    )
  );

-- Admin upload.
drop policy if exists "admin_insert_hive_assets" on storage.objects;
create policy "admin_insert_hive_assets" on storage.objects
  for insert
  with check (
    public.is_admin() and bucket_id in (
      'student-images', 'achievement-icons', 'curriculum-assets',
      'challenge-assets', 'announcement-assets'
    )
  );

-- Admin update.
drop policy if exists "admin_update_hive_assets" on storage.objects;
create policy "admin_update_hive_assets" on storage.objects
  for update
  using (
    public.is_admin() and bucket_id in (
      'student-images', 'achievement-icons', 'curriculum-assets',
      'challenge-assets', 'announcement-assets'
    )
  );

-- Admin delete.
drop policy if exists "admin_delete_hive_assets" on storage.objects;
create policy "admin_delete_hive_assets" on storage.objects
  for delete
  using (
    public.is_admin() and bucket_id in (
      'student-images', 'achievement-icons', 'curriculum-assets',
      'challenge-assets', 'announcement-assets'
    )
  );

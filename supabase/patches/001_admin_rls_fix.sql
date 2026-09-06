-- =============================================================================
-- Admin RLS Patch — run this in Supabase SQL Editor
-- Fixes: admin unable to promote/demote users, update user data, or delete users
-- =============================================================================

-- 1. Allow admin to update any profile row (role changes, dept edits, etc.)
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 2. Allow admin to delete any profile row
drop policy if exists "profiles_admin_delete" on public.profiles;
create policy "profiles_admin_delete" on public.profiles
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 3. Backfill email into profiles for any existing users who signed up before
--    the email field was added to the trigger metadata
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Verify the policies are active:
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

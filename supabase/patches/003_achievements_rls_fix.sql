-- =============================================================================
-- Patch 003: Fix Achievements RLS so admin can see all achievements
-- Run this in the Supabase SQL Editor
-- =============================================================================

-- Drop old achievements_select policy and recreate it to allow admin to see all
DROP POLICY IF EXISTS "achievements_select" ON public.achievements;
CREATE POLICY "achievements_select" ON public.achievements
  FOR SELECT USING (
    auth.uid() = student_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'organizer'))
  );

-- Also ensure admin can update (review) achievements
DROP POLICY IF EXISTS "achievements_update" ON public.achievements;
CREATE POLICY "achievements_update" ON public.achievements
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'organizer'))
  );

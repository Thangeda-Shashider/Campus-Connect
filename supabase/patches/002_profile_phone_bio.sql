-- =============================================================================
-- Profile Enhancement Patch — run this in Supabase SQL Editor
-- Adds phone and bio columns to profiles table
-- =============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('phone', 'bio', 'interests');

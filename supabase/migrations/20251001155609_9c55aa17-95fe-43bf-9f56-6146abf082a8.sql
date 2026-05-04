-- Remove show_in_dir column from venues table
ALTER TABLE public.venues
DROP COLUMN IF EXISTS show_in_dir;

-- Add user_id column to venues table
ALTER TABLE public.venues
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
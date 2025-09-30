-- Remove the available column from resources table
ALTER TABLE public.resources
  DROP COLUMN IF EXISTS available;
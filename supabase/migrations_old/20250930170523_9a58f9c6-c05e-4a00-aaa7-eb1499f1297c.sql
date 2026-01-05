-- Remove tags column from events table
ALTER TABLE public.events DROP COLUMN IF EXISTS tags;
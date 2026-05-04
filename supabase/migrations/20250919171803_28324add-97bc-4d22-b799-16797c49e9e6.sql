-- Add tags column to event_themes table
ALTER TABLE public.event_themes ADD COLUMN IF NOT EXISTS tags TEXT[];

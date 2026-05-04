-- Add premium column to event_themes table
ALTER TABLE public.event_themes ADD COLUMN IF NOT EXISTS premium BOOLEAN NOT NULL DEFAULT false;

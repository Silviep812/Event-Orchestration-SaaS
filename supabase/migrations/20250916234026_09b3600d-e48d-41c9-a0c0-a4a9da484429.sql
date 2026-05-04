-- Add start_time and end_time fields to the events table
-- Idempotent: columns may already exist on remote.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;

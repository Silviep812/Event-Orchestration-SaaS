-- Add status column to existing events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS status event_status_enum DEFAULT 'pending';
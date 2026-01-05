-- Add location column to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS location text;

-- Add comment
COMMENT ON COLUMN public.events.location IS 'Event location or address';
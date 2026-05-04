-- Remove event_type column and add type_id column to events table
ALTER TABLE public.events 
DROP COLUMN IF EXISTS event_type;

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS type_id UUID REFERENCES public.event_types(id);

-- Create an index on type_id for better performance
CREATE INDEX IF NOT EXISTS idx_events_type_id ON public.events(type_id);
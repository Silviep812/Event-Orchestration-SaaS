-- Add unique constraint on event_id to ensure one workflow per event
ALTER TABLE public.workflows DROP CONSTRAINT IF EXISTS workflows_event_id_unique;
ALTER TABLE public.workflows ADD CONSTRAINT workflows_event_id_unique UNIQUE (event_id);

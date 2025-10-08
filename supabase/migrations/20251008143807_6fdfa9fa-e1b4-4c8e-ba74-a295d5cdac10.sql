-- Add unique constraint on event_id to ensure one workflow per event
ALTER TABLE workflows ADD CONSTRAINT workflows_event_id_unique UNIQUE (event_id);
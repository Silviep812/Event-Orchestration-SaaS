-- First, delete any workflows without an event_id (if any exist)
DELETE FROM workflows WHERE event_id IS NULL;

-- Add NOT NULL constraint to event_id column
ALTER TABLE workflows ALTER COLUMN event_id SET NOT NULL;
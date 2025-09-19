-- Add premium column to event_themes table
ALTER TABLE event_themes ADD COLUMN premium BOOLEAN NOT NULL DEFAULT false;
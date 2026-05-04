-- Add event_id column to booking submission tables to link them to actual events
ALTER TABLE rsvp_submissions
ADD COLUMN IF NOT EXISTS event_id text REFERENCES "Create Event"(userid);

ALTER TABLE confirmation_submissions
ADD COLUMN IF NOT EXISTS event_id text REFERENCES "Create Event"(userid);

ALTER TABLE reservation_submissions
ADD COLUMN IF NOT EXISTS event_id text REFERENCES "Create Event"(userid);
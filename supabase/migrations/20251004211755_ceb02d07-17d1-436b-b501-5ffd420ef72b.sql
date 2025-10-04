-- Add venue_id to reservation_submissions to connect reservations with venues
ALTER TABLE reservation_submissions
ADD COLUMN venue_id uuid REFERENCES venues(id) ON DELETE SET NULL;
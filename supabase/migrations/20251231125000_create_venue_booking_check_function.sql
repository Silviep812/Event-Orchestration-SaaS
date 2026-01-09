-- Create function to check if venue booking is completed
-- This function is used by both date locking triggers and change request application
-- Must run before 20251231130000 (autofill migration) and 20251231150000 (lock dates migration)
CREATE OR REPLACE FUNCTION is_venue_booking_completed(p_event_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_reservation BOOLEAN;
BEGIN
  -- Check if there's a reservation submission for this event
  -- This indicates venue booking transaction is completed
  SELECT EXISTS (
    SELECT 1 FROM reservation_submissions
    WHERE event_id = p_event_id
  ) INTO v_has_reservation;
  
  RETURN v_has_reservation;
END;
$$;











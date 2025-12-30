-- Lock event dates when venue booking is completed
-- Requirement: Event starting and ending dates are locked if Venue booking transaction has been completed
-- The event has to be deleted and created as a new event to change dates
-- Note: is_venue_booking_completed() function is created in migration 20251231125000

-- Create trigger function to prevent date changes on "Create Event" when venue booked
CREATE OR REPLACE FUNCTION prevent_date_change_when_venue_booked()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If venue booking is completed, prevent date changes
  IF is_venue_booking_completed(NEW.userid) THEN
    IF (OLD.event_start_date IS DISTINCT FROM NEW.event_start_date) OR
       (OLD.event_end_date IS DISTINCT FROM NEW.event_end_date) OR
       (OLD.event_start_time IS DISTINCT FROM NEW.event_start_time) OR
       (OLD.event_end_time IS DISTINCT FROM NEW.event_end_time) THEN
      RAISE EXCEPTION 'Event dates are locked because venue booking is completed. Delete and recreate the event to change dates.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on "Create Event" table
DROP TRIGGER IF EXISTS lock_dates_when_venue_booked ON "Create Event";
CREATE TRIGGER lock_dates_when_venue_booked
BEFORE UPDATE ON "Create Event"
FOR EACH ROW
EXECUTE FUNCTION prevent_date_change_when_venue_booked();

-- Also prevent date changes in "Manage Event" table
CREATE OR REPLACE FUNCTION prevent_manage_event_date_change_when_venue_booked()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_event_user_id TEXT;
BEGIN
  -- Get the event_user_id which corresponds to Create Event.userid
  v_event_user_id := NEW.event_user_id;
  
  -- If venue booking is completed, prevent date changes
  IF is_venue_booking_completed(v_event_user_id) THEN
    IF (OLD.event_date IS DISTINCT FROM NEW.event_date) OR
       (OLD.event_time IS DISTINCT FROM NEW.event_time) THEN
      RAISE EXCEPTION 'Event dates are locked because venue booking is completed. Delete and recreate the event to change dates.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on "Manage Event" table
DROP TRIGGER IF EXISTS lock_manage_event_dates_when_venue_booked ON "Manage Event";
CREATE TRIGGER lock_manage_event_dates_when_venue_booked
BEFORE UPDATE ON "Manage Event"
FOR EACH ROW
EXECUTE FUNCTION prevent_manage_event_date_change_when_venue_booked();

-- Also prevent date changes in events table (UUID-based events)
CREATE OR REPLACE FUNCTION prevent_events_date_change_when_venue_booked()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_event_id_text TEXT;
BEGIN
  -- Convert UUID to TEXT for checking
  v_event_id_text := NEW.id::TEXT;
  
  -- If venue booking is completed, prevent date changes
  IF is_venue_booking_completed(v_event_id_text) THEN
    IF (OLD.start_date IS DISTINCT FROM NEW.start_date) OR
       (OLD.end_date IS DISTINCT FROM NEW.end_date) OR
       (OLD.start_time IS DISTINCT FROM NEW.start_time) OR
       (OLD.end_time IS DISTINCT FROM NEW.end_time) THEN
      RAISE EXCEPTION 'Event dates are locked because venue booking is completed. Delete and recreate the event to change dates.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on events table
DROP TRIGGER IF EXISTS lock_events_dates_when_venue_booked ON events;
CREATE TRIGGER lock_events_dates_when_venue_booked
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION prevent_events_date_change_when_venue_booked();


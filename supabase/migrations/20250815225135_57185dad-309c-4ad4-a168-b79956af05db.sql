-- Create function to sync Create Event to Manage Event
CREATE OR REPLACE FUNCTION public.sync_create_event_to_manage_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO "Manage Event" (
    event_user_id,
    event_contact_name,
    event_contact_email,
    event_contact_ph_nbr,
    event_date,
    event_time,
    event_theme,
    event_type,
    event_status,
    created_at
  )
  VALUES (
    NEW.userid,
    NEW.contact_name,
    NEW.email,
    NEW.contact_phone_nbr,
    NEW.event_start_date,
    NEW.event_start_time,
    CASE 
      WHEN NEW.event_theme IS NOT NULL AND array_length(NEW.event_theme, 1) > 0 
      THEN NEW.event_theme[1]::text 
      ELSE NULL 
    END,
    'Event', -- Default event type
    'Planning', -- Default status
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-sync new events
DROP TRIGGER IF EXISTS sync_new_events_to_manage ON "Create Event";
CREATE TRIGGER sync_new_events_to_manage
  AFTER INSERT ON "Create Event"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_create_event_to_manage_event();
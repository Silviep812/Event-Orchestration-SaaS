-- Create a sanitized view that excludes sensitive contact fields from "Create Event"
CREATE OR REPLACE VIEW public.create_event_safe AS
SELECT 
  event_start_date,
  event_end_date,
  event_start_time,
  event_end_time,
  event_theme,
  booking_type,
  event_collaborators,
  event_description,
  event_location,
  is_venue_available,
  is_booking_available,
  is_service_rental_available,
  service_rental_type,
  supplier_type,
  is_transportation_available,
  is_supply_available,
  transportation_type,
  event_budget,
  notification,
  is_service_type_availabe,
  resources,
  priority,
  created_at
FROM "Create Event";

COMMENT ON VIEW public.create_event_safe IS 'Sanitized view of Create Event without contact_name, email, or contact_phone_nbr. RLS on the base table still applies, ensuring users only see their own rows.';

-- Optional helper function for clients to fetch their own sanitized events
CREATE OR REPLACE FUNCTION public.get_my_events_safe()
RETURNS TABLE (
  event_start_date date,
  event_end_date date,
  event_start_time timestamptz,
  event_end_time timestamptz,
  event_theme text[],
  booking_type text[],
  event_collaborators text[],
  event_description text,
  event_location text[],
  is_venue_available boolean,
  is_booking_available boolean,
  is_service_rental_available boolean,
  service_rental_type text,
  supplier_type text[],
  is_transportation_available boolean,
  is_supply_available boolean,
  transportation_type text,
  event_budget numeric,
  notification text,
  is_service_type_availabe boolean,
  resources text[],
  priority text[],
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT 
    event_start_date,
    event_end_date,
    event_start_time,
    event_end_time,
    event_theme,
    booking_type,
    event_collaborators,
    event_description,
    event_location,
    is_venue_available,
    is_booking_available,
    is_service_rental_available,
    service_rental_type,
    supplier_type,
    is_transportation_available,
    is_supply_available,
    transportation_type,
    event_budget,
    notification,
    is_service_type_availabe,
    resources,
    priority,
    created_at
  FROM "Create Event"
  WHERE userid = (auth.uid())::text;
$$;
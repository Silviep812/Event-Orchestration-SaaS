-- Create a sanitized view that excludes sensitive contact fields from "Create Event"
-- PostgreSQL cannot use CREATE OR REPLACE VIEW to drop columns from an existing view (42P16).
-- Remote DBs may already have a wider definition; drop first so this migration replays safely.
DROP VIEW IF EXISTS public.create_event_safe CASCADE;

CREATE VIEW public.create_event_safe AS
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

-- get_my_events_safe() is created in the next migration (20250816092014) after the view
-- includes userid. A large CREATE FUNCTION here was triggering SQLSTATE 08P01 on remote push.
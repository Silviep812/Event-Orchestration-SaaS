-- Remove the security definer view and replace with security invoker
DROP VIEW IF EXISTS public.create_event_safe;

-- Create a properly secured view with SECURITY INVOKER (default, safer)
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
  created_at,
  userid  -- Include userid so RLS can work properly
FROM "Create Event";

COMMENT ON VIEW public.create_event_safe IS 'Sanitized view of Create Event without sensitive contact fields (contact_name, email, contact_phone_nbr). Uses SECURITY INVOKER so RLS policies are enforced based on the querying user.';

-- Enable RLS on the view (inherits from base table but explicit is better)
ALTER VIEW public.create_event_safe SET (security_invoker = true);

-- Current user's rows from the sanitized view (compact definition avoids 08P01 on some hosts)
DROP FUNCTION IF EXISTS public.get_my_events_safe() CASCADE;

CREATE FUNCTION public.get_my_events_safe()
RETURNS SETOF public.create_event_safe
LANGUAGE sql
STABLE
SET search_path = public
AS $function$
  SELECT *
  FROM public.create_event_safe
  WHERE userid = (auth.uid())::text;
$function$;
-- Create completely new enum with only the new role values
CREATE TYPE public.app_role_final AS ENUM (
  'host',
  'organizer', 
  'event_planner',
  'venue_owner',
  'hospitality_provider'
);

-- Update user_roles table to use the final enum
ALTER TABLE public.user_roles ALTER COLUMN role TYPE app_role_final USING 
CASE 
  WHEN role::text = 'admin' THEN 'host'::app_role_final
  WHEN role::text = 'event_manager' THEN 'organizer'::app_role_final
  WHEN role::text = 'vendor_coordinator' THEN 'event_planner'::app_role_final
  WHEN role::text = 'budget_manager' THEN 'event_planner'::app_role_final
  WHEN role::text = 'task_coordinator' THEN 'event_planner'::app_role_final
  WHEN role::text = 'client' THEN 'organizer'::app_role_final
  ELSE role::text::app_role_final
END;

-- Update the has_role function to use the final enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role_final)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Replace the old enum with the new one
ALTER TYPE public.app_role RENAME TO app_role_obsolete;
ALTER TYPE public.app_role_final RENAME TO app_role;

-- Drop the obsolete enum
DROP TYPE IF EXISTS public.app_role_obsolete CASCADE;

-- Verify the final enum contains only new values
SELECT enum_range(NULL::app_role) AS final_roles;
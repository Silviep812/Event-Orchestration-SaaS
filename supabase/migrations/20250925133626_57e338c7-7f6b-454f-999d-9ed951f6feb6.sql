-- Create new enum with only the new values
DO $$
BEGIN
  CREATE TYPE public.app_role_new AS ENUM (
    'host',
    'organizer',
    'event_planner',
    'venue_owner',
    'hospitality_provider'
  );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Update user_roles table to use new enum (and migrate any existing data)
-- Map old roles to new ones: admin->host, event_manager->organizer, etc.
ALTER TABLE public.user_roles
ADD COLUMN role_new app_role_new;

-- Migrate existing data by mapping old roles to new equivalent roles
-- Remote parity: app_role may include values not in app_role_new (e.g. manager, coordinator, viewer).
UPDATE public.user_roles SET role_new =
CASE
  WHEN role::text = 'admin' THEN 'host'::public.app_role_new
  WHEN role::text = 'event_manager' THEN 'organizer'::public.app_role_new
  WHEN role::text = 'vendor_coordinator' THEN 'event_planner'::public.app_role_new
  WHEN role::text = 'budget_manager' THEN 'event_planner'::public.app_role_new
  WHEN role::text = 'task_coordinator' THEN 'event_planner'::public.app_role_new
  WHEN role::text = 'client' THEN 'organizer'::public.app_role_new
  WHEN role::text = 'manager' THEN 'event_planner'::public.app_role_new
  WHEN role::text = 'coordinator' THEN 'event_planner'::public.app_role_new
  WHEN role::text = 'viewer' THEN 'organizer'::public.app_role_new
  WHEN role::text IN ('host', 'organizer', 'event_planner', 'venue_owner', 'hospitality_provider')
    THEN role::text::public.app_role_new
  ELSE 'organizer'::public.app_role_new
END;

-- Make the new column not null and drop the old one
ALTER TABLE public.user_roles ALTER COLUMN role_new SET NOT NULL;
ALTER TABLE public.user_roles DROP COLUMN role;
ALTER TABLE public.user_roles RENAME COLUMN role_new TO role;

-- Update the unique constraint
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

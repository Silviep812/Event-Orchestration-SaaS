-- Create new enum with only the new values
CREATE TYPE public.app_role_new AS ENUM (
  'host',
  'organizer', 
  'event_planner',
  'venue_owner',
  'hospitality_provider'
);

-- Update user_roles table to use new enum (and migrate any existing data)
-- Map old roles to new ones: admin->host, event_manager->organizer, etc.
ALTER TABLE public.user_roles 
ADD COLUMN role_new app_role_new;

-- Migrate existing data by mapping old roles to new equivalent roles
UPDATE public.user_roles SET role_new = 
CASE 
  WHEN role = 'admin' THEN 'host'
  WHEN role = 'event_manager' THEN 'organizer'
  WHEN role = 'vendor_coordinator' THEN 'event_planner'
  WHEN role = 'budget_manager' THEN 'event_planner'
  WHEN role = 'task_coordinator' THEN 'event_planner' 
  WHEN role = 'client' THEN 'organizer'
  ELSE role::text::app_role_new  -- For any new roles already using new enum values
END;

-- Make the new column not null and drop the old one
ALTER TABLE public.user_roles ALTER COLUMN role_new SET NOT NULL;
ALTER TABLE public.user_roles DROP COLUMN role;
ALTER TABLE public.user_roles RENAME COLUMN role_new TO role;

-- Update the unique constraint
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
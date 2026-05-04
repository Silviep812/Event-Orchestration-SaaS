-- Create permission level enum (skip if re-applied after partial run)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_type WHERE typname = 'permission_level') THEN
    CREATE TYPE permission_level AS ENUM ('admin', 'coordinator', 'viewer');
  END IF;
END $$;

-- Replace mis-shaped or legacy role_permission_groups (e.g. missing role column after out-of-order applies)
DO $$
BEGIN
  IF pg_catalog.to_regclass('public.role_permission_groups') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'role_permission_groups'
         AND column_name = 'role'
     ) THEN
    EXECUTE 'DROP TABLE public.role_permission_groups CASCADE';
  END IF;
END $$;

-- Create role permission groups table (app_role values follow 20251007144219)
CREATE TABLE IF NOT EXISTS public.role_permission_groups (
  role app_role PRIMARY KEY,
  permission_group permission_level NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.role_permission_groups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read permission mappings
DROP POLICY IF EXISTS "Anyone can view permission groups" ON public.role_permission_groups;
CREATE POLICY "Anyone can view permission groups"
ON public.role_permission_groups
FOR SELECT
TO authenticated
USING (true);

-- Map app_role values to permission tiers (enum shape depends on whether 20251007144219 ran)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_enum e
    JOIN pg_catalog.pg_type t ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'app_role' AND e.enumlabel = 'manager'
  ) THEN
    INSERT INTO public.role_permission_groups (role, permission_group) VALUES
      ('manager', 'admin'),
      ('event_planner', 'coordinator'),
      ('organizer', 'coordinator'),
      ('host', 'viewer'),
      ('venue_owner', 'viewer'),
      ('hospitality_provider', 'viewer')
    ON CONFLICT (role) DO NOTHING;
  ELSIF EXISTS (
    SELECT 1 FROM pg_catalog.pg_enum e
    JOIN pg_catalog.pg_type t ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'app_role' AND e.enumlabel = 'admin'
  ) THEN
    INSERT INTO public.role_permission_groups (role, permission_group) VALUES
      ('admin', 'admin'),
      ('coordinator', 'coordinator'),
      ('viewer', 'viewer')
    ON CONFLICT (role) DO NOTHING;
  END IF;
END $$;

-- Remote drift: drop all overloads so CREATE OR REPLACE cannot leave duplicate identities
DO $$
DECLARE
  fa text;
BEGIN
  FOR fa IN
    SELECT pg_catalog.pg_get_function_identity_arguments(o.oid)
    FROM pg_catalog.pg_proc o
    JOIN pg_catalog.pg_namespace n ON n.oid = o.pronamespace
    WHERE n.nspname = 'public' AND o.proname = 'has_permission_level'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.has_permission_level(%s) CASCADE', fa);
  END LOOP;
  FOR fa IN
    SELECT pg_catalog.pg_get_function_identity_arguments(o.oid)
    FROM pg_catalog.pg_proc o
    JOIN pg_catalog.pg_namespace n ON n.oid = o.pronamespace
    WHERE n.nspname = 'public' AND o.proname = 'has_min_permission_level'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.has_min_permission_level(%s) CASCADE', fa);
  END LOOP;
END $$;

-- Create security definer function to check permission levels
CREATE OR REPLACE FUNCTION public.has_permission_level(_user_id uuid, _level permission_level)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permission_groups rpg ON ur.role = rpg.role
    WHERE ur.user_id = _user_id
      AND rpg.permission_group = _level
  )
$$;

-- Helper function to check if user has at least a certain permission level
-- (admin > coordinator > viewer)
CREATE OR REPLACE FUNCTION public.has_min_permission_level(_user_id uuid, _level permission_level)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permission_groups rpg ON ur.role = rpg.role
    WHERE ur.user_id = _user_id
      AND (
        rpg.permission_group = _level OR
        (_level = 'viewer' AND rpg.permission_group IN ('coordinator', 'admin')) OR
        (_level = 'coordinator' AND rpg.permission_group = 'admin')
      )
  )
$$;

-- Create permission level enum
CREATE TYPE permission_level AS ENUM ('admin', 'coordinator', 'viewer');

-- Create role permission groups table
CREATE TABLE public.role_permission_groups (
  role app_role PRIMARY KEY,
  permission_group permission_level NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.role_permission_groups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read permission mappings
CREATE POLICY "Anyone can view permission groups"
ON public.role_permission_groups
FOR SELECT
TO authenticated
USING (true);

-- Insert default permission mappings
INSERT INTO public.role_permission_groups (role, permission_group) VALUES
  ('manager', 'admin'),
  ('event_planner', 'coordinator'),
  ('organizer', 'coordinator'),
  ('host', 'viewer'),
  ('venue_owner', 'viewer'),
  ('hospitality_provider', 'viewer');

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
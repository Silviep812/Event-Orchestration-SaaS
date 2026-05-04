-- Add permission_level and event_id columns to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS permission_level permission_level,
ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id) ON DELETE CASCADE;

-- Populate permission_level for existing rows based on role_permission_groups
UPDATE public.user_roles ur
SET permission_level = rpg.permission_group
FROM public.role_permission_groups rpg
WHERE ur.role = rpg.role
  AND ur.permission_level IS NULL;

-- Drop old functions CASCADE (this will drop all policies using them)
DROP FUNCTION IF EXISTS public.has_permission_level(uuid, permission_level) CASCADE;
DROP FUNCTION IF EXISTS public.has_permission_level(uuid, permission_level, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.has_min_permission_level(uuid, permission_level) CASCADE;
DROP FUNCTION IF EXISTS public.has_min_permission_level(uuid, permission_level, uuid) CASCADE;

-- Create updated has_permission_level function with optional event_id
CREATE OR REPLACE FUNCTION public.has_permission_level(_user_id uuid, _level permission_level, _event_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND permission_level = _level
      AND (_event_id IS NULL OR event_id = _event_id OR event_id IS NULL)
  )
$$;

-- Create updated has_min_permission_level function with optional event_id
CREATE OR REPLACE FUNCTION public.has_min_permission_level(_user_id uuid, _level permission_level, _event_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (_event_id IS NULL OR event_id = _event_id OR event_id IS NULL)
      AND (
        permission_level = _level OR
        (_level = 'viewer' AND permission_level IN ('coordinator', 'admin')) OR
        (_level = 'coordinator' AND permission_level = 'admin')
      )
  )
$$;

-- Recreate admin policies (DROP CASCADE may have skipped policies that used policy_* helpers from 20251007151216)
DROP POLICY IF EXISTS "Admins can view all events" ON public."Create Event";
CREATE POLICY "Admins can view all events"
ON public."Create Event"
FOR SELECT
TO authenticated
USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));

DROP POLICY IF EXISTS "Admins can delete events" ON public."Create Event";
CREATE POLICY "Admins can delete events"
ON public."Create Event"
FOR DELETE
TO authenticated
USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));

DROP POLICY IF EXISTS "Admins can view all managed events" ON public."Manage Event";
CREATE POLICY "Admins can view all managed events"
ON public."Manage Event"
FOR SELECT
TO authenticated
USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));

DROP POLICY IF EXISTS "Admins can delete managed events" ON public."Manage Event";
CREATE POLICY "Admins can delete managed events"
ON public."Manage Event"
FOR DELETE
TO authenticated
USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));

DROP POLICY IF EXISTS "Admins can view all budget items" ON public.budget_items;
CREATE POLICY "Admins can view all budget items"
ON public.budget_items
FOR SELECT
TO authenticated
USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));

DROP POLICY IF EXISTS "Admins can delete budget items" ON public.budget_items;
CREATE POLICY "Admins can delete budget items"
ON public.budget_items
FOR DELETE
TO authenticated
USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));

DROP POLICY IF EXISTS "Admins can view all role assignments" ON public.user_roles;
CREATE POLICY "Admins can view all role assignments"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));

DROP POLICY IF EXISTS "Admins can insert role assignments" ON public.user_roles;
CREATE POLICY "Admins can insert role assignments"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));

DROP POLICY IF EXISTS "Admins can update role assignments" ON public.user_roles;
CREATE POLICY "Admins can update role assignments"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level))
WITH CHECK (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));

DROP POLICY IF EXISTS "Admins can delete role assignments" ON public.user_roles;
CREATE POLICY "Admins can delete role assignments"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));

DROP POLICY IF EXISTS "Bootstrap: Allow role assignment for non-admin users" ON public.user_roles;
CREATE POLICY "Bootstrap: Allow role assignment for non-admin users"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND NOT public.has_permission_level(auth.uid(), 'admin'::public.permission_level)
);

DROP POLICY IF EXISTS "Bootstrap: Allow role updates for non-admin users" ON public.user_roles;
CREATE POLICY "Bootstrap: Allow role updates for non-admin users"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND NOT public.has_permission_level(auth.uid(), 'admin'::public.permission_level)
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND NOT public.has_permission_level(auth.uid(), 'admin'::public.permission_level)
);
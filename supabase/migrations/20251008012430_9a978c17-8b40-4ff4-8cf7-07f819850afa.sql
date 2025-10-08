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
DROP FUNCTION IF EXISTS public.has_min_permission_level(uuid, permission_level) CASCADE;

-- Create updated has_permission_level function with optional event_id
CREATE FUNCTION public.has_permission_level(_user_id uuid, _level permission_level, _event_id uuid DEFAULT NULL)
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
CREATE FUNCTION public.has_min_permission_level(_user_id uuid, _level permission_level, _event_id uuid DEFAULT NULL)
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

-- Recreate all policies that were dropped

-- Create Event policies
CREATE POLICY "Admins can view all events"
ON public."Create Event"
FOR SELECT
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

CREATE POLICY "Admins can delete events"
ON public."Create Event"
FOR DELETE
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

-- Manage Event policies
CREATE POLICY "Admins can view all managed events"
ON public."Manage Event"
FOR SELECT
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

CREATE POLICY "Admins can delete managed events"
ON public."Manage Event"
FOR DELETE
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

-- Budget items policies
CREATE POLICY "Admins can view all budget items"
ON public.budget_items
FOR SELECT
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

CREATE POLICY "Admins can delete budget items"
ON public.budget_items
FOR DELETE
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

-- User roles policies
CREATE POLICY "Admins can view all role assignments"
ON public.user_roles
FOR SELECT
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

CREATE POLICY "Admins can insert role assignments"
ON public.user_roles
FOR INSERT
WITH CHECK (has_permission_level(auth.uid(), 'admin'::permission_level));

CREATE POLICY "Admins can update role assignments"
ON public.user_roles
FOR UPDATE
USING (has_permission_level(auth.uid(), 'admin'::permission_level))
WITH CHECK (has_permission_level(auth.uid(), 'admin'::permission_level));

CREATE POLICY "Admins can delete role assignments"
ON public.user_roles
FOR DELETE
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

-- Bootstrap policies
CREATE POLICY "Bootstrap: Allow role assignment for non-admin users"
ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND NOT has_permission_level(auth.uid(), 'admin'::permission_level)
);

CREATE POLICY "Bootstrap: Allow role updates for non-admin users"
ON public.user_roles
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND NOT has_permission_level(auth.uid(), 'admin'::permission_level)
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND NOT has_permission_level(auth.uid(), 'admin'::permission_level)
);
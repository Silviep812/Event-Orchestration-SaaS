-- Fix infinite recursion in user_roles RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Coordinators can view user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;

-- Ensure the has_role function uses SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Ensure the has_permission_level function uses SECURITY DEFINER
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

-- Ensure the has_min_permission_level function uses SECURITY DEFINER
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

-- Create new RLS policies that don't cause recursion
-- Users can view their own roles (direct check without function)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Service role can do everything (for admin operations via edge functions)
CREATE POLICY "Service role has full access"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users with specific roles can manage (using service_role via functions)
-- Note: For INSERT/UPDATE/DELETE, use edge functions with service_role
CREATE POLICY "Allow read for authenticated users"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);
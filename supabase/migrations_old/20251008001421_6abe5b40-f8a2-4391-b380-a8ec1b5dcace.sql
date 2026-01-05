-- Complete fix for user_roles infinite recursion
-- Step 1: Drop ALL existing policies on user_roles
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_roles' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.user_roles';
    END LOOP;
END $$;

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create ONLY simple, non-recursive policies
-- Policy 1: Users can view their own roles (no function calls)
CREATE POLICY "user_roles_select_own"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: All authenticated users can view all roles (for RoleManager display)
CREATE POLICY "user_roles_select_all"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Only service_role can modify
CREATE POLICY "user_roles_service_role"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 4: Ensure security definer functions work correctly
-- These functions bypass RLS because of SECURITY DEFINER
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
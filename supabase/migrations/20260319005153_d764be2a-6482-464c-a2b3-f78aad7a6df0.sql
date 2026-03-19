
-- 1. Fix team functions to reference correct table (task_collaborator_assignments instead of team_assignments)
CREATE OR REPLACE FUNCTION public.is_team_admin(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.task_collaborator_assignments
    WHERE user_id = _user_id
      AND team_id = _team_id
      AND team_admin = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.task_collaborator_assignments
    WHERE user_id = _user_id
      AND team_id = _team_id
  );
$$;

CREATE OR REPLACE FUNCTION public.are_team_members(_user_id_1 uuid, _user_id_2 uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.task_collaborator_assignments ta1
    JOIN public.task_collaborator_assignments ta2 ON ta1.team_id = ta2.team_id
    WHERE ta1.user_id = _user_id_1
      AND ta2.user_id = _user_id_2
  )
$$;

-- 2. Remove overly permissive user_roles SELECT policy
DROP POLICY IF EXISTS "user_roles_select_all" ON public.user_roles;

-- 3. Fix task_collaborator_assignments self-elevation: replace unrestricted INSERT with restricted one
DROP POLICY IF EXISTS "Users can insert their own team assignments" ON public.task_collaborator_assignments;

CREATE POLICY "Users can insert own viewer assignments"
ON public.task_collaborator_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND team_admin = false
  AND is_collaborator = false
);

-- 4. Restrict UPDATE/DELETE on directory tables to admins only
-- entertainments
DROP POLICY IF EXISTS "Authenticated users can delete entertainments" ON public.entertainments;
DROP POLICY IF EXISTS "Authenticated users can update entertainments" ON public.entertainments;

CREATE POLICY "Admins can update entertainments"
ON public.entertainments FOR UPDATE TO authenticated
USING (has_permission_level(auth.uid(), 'admin'::permission_level))
WITH CHECK (has_permission_level(auth.uid(), 'admin'::permission_level));

CREATE POLICY "Admins can delete entertainments"
ON public.entertainments FOR DELETE TO authenticated
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

-- venues (has user_id column, so allow owner OR admin)
DROP POLICY IF EXISTS "Authenticated users can delete venues" ON public.venues;
DROP POLICY IF EXISTS "Authenticated users can update venues" ON public.venues;

CREATE POLICY "Owners or admins can update venues"
ON public.venues FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR has_permission_level(auth.uid(), 'admin'::permission_level))
WITH CHECK (user_id = auth.uid() OR has_permission_level(auth.uid(), 'admin'::permission_level));

CREATE POLICY "Owners or admins can delete venues"
ON public.venues FOR DELETE TO authenticated
USING (user_id = auth.uid() OR has_permission_level(auth.uid(), 'admin'::permission_level));

-- suppliers
DROP POLICY IF EXISTS "Authenticated users can delete suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON public.suppliers;

CREATE POLICY "Admins can update suppliers"
ON public.suppliers FOR UPDATE TO authenticated
USING (has_permission_level(auth.uid(), 'admin'::permission_level))
WITH CHECK (has_permission_level(auth.uid(), 'admin'::permission_level));

CREATE POLICY "Admins can delete suppliers"
ON public.suppliers FOR DELETE TO authenticated
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

-- marketing_profiles
DROP POLICY IF EXISTS "Authenticated users can delete marketing_profiles" ON public.marketing_profiles;
DROP POLICY IF EXISTS "Authenticated users can update marketing_profiles" ON public.marketing_profiles;

CREATE POLICY "Admins can update marketing_profiles"
ON public.marketing_profiles FOR UPDATE TO authenticated
USING (has_permission_level(auth.uid(), 'admin'::permission_level))
WITH CHECK (has_permission_level(auth.uid(), 'admin'::permission_level));

CREATE POLICY "Admins can delete marketing_profiles"
ON public.marketing_profiles FOR DELETE TO authenticated
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

-- hospitality_profiles
DROP POLICY IF EXISTS "Users can delete hospitality profiles" ON public.hospitality_profiles;
DROP POLICY IF EXISTS "Users can update hospitality profiles" ON public.hospitality_profiles;

CREATE POLICY "Admins can update hospitality_profiles"
ON public.hospitality_profiles FOR UPDATE TO authenticated
USING (has_permission_level(auth.uid(), 'admin'::permission_level))
WITH CHECK (has_permission_level(auth.uid(), 'admin'::permission_level));

CREATE POLICY "Admins can delete hospitality_profiles"
ON public.hospitality_profiles FOR DELETE TO authenticated
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

-- workflow_types
DROP POLICY IF EXISTS "Authenticated users can delete workflow types" ON public.workflow_types;
DROP POLICY IF EXISTS "Authenticated users can update workflow types" ON public.workflow_types;

CREATE POLICY "Admins can update workflow_types"
ON public.workflow_types FOR UPDATE TO authenticated
USING (has_permission_level(auth.uid(), 'admin'::permission_level))
WITH CHECK (has_permission_level(auth.uid(), 'admin'::permission_level));

CREATE POLICY "Admins can delete workflow_types"
ON public.workflow_types FOR DELETE TO authenticated
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

-- 5. Drop plaintext password columns from Authorization table
ALTER TABLE public."Authorization" DROP COLUMN IF EXISTS pass_word;
ALTER TABLE public."Authorization" DROP COLUMN IF EXISTS create_password;
ALTER TABLE public."Authorization" DROP COLUMN IF EXISTS reset_pw;
ALTER TABLE public."Authorization" DROP COLUMN IF EXISTS create_userid;

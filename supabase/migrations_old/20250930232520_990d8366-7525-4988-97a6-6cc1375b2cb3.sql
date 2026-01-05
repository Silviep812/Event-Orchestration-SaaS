-- Ensure RLS is enabled
ALTER TABLE public.team_assignments ENABLE ROW LEVEL SECURITY;

-- Remove recursive/duplicate policies that cause infinite recursion
DROP POLICY IF EXISTS "Team admins can add members" ON public.team_assignments;
DROP POLICY IF EXISTS "Team admins can remove members" ON public.team_assignments;
DROP POLICY IF EXISTS "Team admins can update members" ON public.team_assignments;
DROP POLICY IF EXISTS "Users can view their team assignments" ON public.team_assignments;

-- Recreate the helper function (idempotent) to ensure SECURITY DEFINER and proper search_path
CREATE OR REPLACE FUNCTION public.is_team_admin(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_assignments
    WHERE user_id = _user_id
      AND team_id = _team_id
      AND team_admin = true
  );
$$;

-- Keep only non-recursive policies
-- Insert: allow existing admins or first self-admin creation
DROP POLICY IF EXISTS "Team admins can create team assignments" ON public.team_assignments;
CREATE POLICY "Team admins can create team assignments"
ON public.team_assignments
FOR INSERT
TO public
WITH CHECK (
  public.is_team_admin(auth.uid(), team_id)
  OR (user_id = auth.uid() AND team_admin = true)
);

-- Update: only admins of that team
DROP POLICY IF EXISTS "Team admins can update team assignments" ON public.team_assignments;
CREATE POLICY "Team admins can update team assignments"
ON public.team_assignments
FOR UPDATE
TO public
USING (public.is_team_admin(auth.uid(), team_id))
WITH CHECK (public.is_team_admin(auth.uid(), team_id));

-- Delete: only admins of that team
DROP POLICY IF EXISTS "Team admins can delete team assignments" ON public.team_assignments;
CREATE POLICY "Team admins can delete team assignments"
ON public.team_assignments
FOR DELETE
TO public
USING (public.is_team_admin(auth.uid(), team_id));

-- Select: members can see their rows; admins can see all for their team
DROP POLICY IF EXISTS "Users can view team assignments they are part of" ON public.team_assignments;
CREATE POLICY "Users can view team assignments they are part of"
ON public.team_assignments
FOR SELECT
TO public
USING ((user_id = auth.uid()) OR public.is_team_admin(auth.uid(), team_id));
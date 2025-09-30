-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view team assignments they are part of" ON public.team_assignments;
DROP POLICY IF EXISTS "Team admins can create team assignments" ON public.team_assignments;
DROP POLICY IF EXISTS "Team admins can update team assignments" ON public.team_assignments;
DROP POLICY IF EXISTS "Team admins can delete team assignments" ON public.team_assignments;

-- Create security definer function to check if user is team admin
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
  )
$$;

-- Recreate policies using the security definer function
CREATE POLICY "Users can view team assignments they are part of"
ON public.team_assignments
FOR SELECT
USING (
  user_id = auth.uid() OR
  public.is_team_admin(auth.uid(), team_id)
);

CREATE POLICY "Team admins can create team assignments"
ON public.team_assignments
FOR INSERT
WITH CHECK (
  public.is_team_admin(auth.uid(), team_id)
);

CREATE POLICY "Team admins can update team assignments"
ON public.team_assignments
FOR UPDATE
USING (public.is_team_admin(auth.uid(), team_id))
WITH CHECK (public.is_team_admin(auth.uid(), team_id));

CREATE POLICY "Team admins can delete team assignments"
ON public.team_assignments
FOR DELETE
USING (public.is_team_admin(auth.uid(), team_id));
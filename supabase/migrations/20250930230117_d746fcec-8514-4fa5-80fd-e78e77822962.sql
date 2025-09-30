-- Fix INSERT policy to allow first team admin creation
DROP POLICY IF EXISTS "Team admins can create team assignments" ON public.team_assignments;

CREATE POLICY "Team admins can create team assignments"
ON public.team_assignments
FOR INSERT
WITH CHECK (
  -- Allow if user is already a team admin
  public.is_team_admin(auth.uid(), team_id)
  OR
  -- Allow if user is creating themselves as first admin
  (user_id = auth.uid() AND team_admin = true)
);
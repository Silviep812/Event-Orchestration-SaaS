-- Drop the restrictive existing policy that only allows viewing own assignments or admin assignments
DROP POLICY IF EXISTS "Users can view team assignments they are part of" ON public.team_assignments;

-- Create new policy allowing team members to view all assignments in their teams
CREATE POLICY "Users can view team assignments they are part of"
ON public.team_assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_assignments ta
    WHERE ta.team_id = team_assignments.team_id
      AND ta.user_id = auth.uid()
  )
);
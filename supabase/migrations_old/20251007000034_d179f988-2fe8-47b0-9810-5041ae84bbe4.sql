-- Fix existing team assignment to set admin flag
UPDATE public.team_assignments
SET team_admin = true, updated_at = now()
WHERE team_id = 'e853ef8a-c886-444b-b7db-7359118b58a8'
  AND user_id = '8ca9f4e0-8dc0-42b3-85ba-ee879ad1ed4f';

-- Ensure RLS is enabled on team_assignments
ALTER TABLE public.team_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their team assignments" ON public.team_assignments;
DROP POLICY IF EXISTS "Users can insert their own team assignments" ON public.team_assignments;
DROP POLICY IF EXISTS "Team admins can manage team assignments" ON public.team_assignments;

-- Allow users to view their own team assignments
CREATE POLICY "Users can view their team assignments"
ON public.team_assignments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow users to insert their own team assignments when creating a team
CREATE POLICY "Users can insert their own team assignments"
ON public.team_assignments
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow team admins to manage all assignments for their teams
CREATE POLICY "Team admins can manage team assignments"
ON public.team_assignments
FOR ALL
TO authenticated
USING (is_team_admin(auth.uid(), team_id));
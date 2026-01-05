-- Ensure RLS is enabled
ALTER TABLE public.team_assignments ENABLE ROW LEVEL SECURITY;

-- Create a SECURITY DEFINER helper to check membership without triggering recursion
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid, _team_id uuid)
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
  );
$$;

-- Drop all existing SELECT policies on team_assignments to remove any recursive ones
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'team_assignments'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.team_assignments', r.policyname);
  END LOOP;
END $$;

-- Allow any team member to view all assignments within their teams
CREATE POLICY "Team members can view assignments in their teams"
ON public.team_assignments
FOR SELECT
TO authenticated
USING (
  public.is_team_member(auth.uid(), team_id)
);
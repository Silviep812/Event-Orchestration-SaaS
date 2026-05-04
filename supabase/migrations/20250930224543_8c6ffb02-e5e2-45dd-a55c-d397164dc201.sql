-- Create team_assignments table
CREATE TABLE IF NOT EXISTS public.team_assignments (
  id SERIAL PRIMARY KEY,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_admin boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable RLS
ALTER TABLE public.team_assignments ENABLE ROW LEVEL SECURITY;

-- Users can view team assignments they're part of
CREATE POLICY "Users can view their team assignments"
ON public.team_assignments
FOR SELECT
USING (user_id = auth.uid() OR team_id IN (
  SELECT team_id FROM public.team_assignments WHERE user_id = auth.uid()
));

-- Team admins can insert team assignments
CREATE POLICY "Team admins can add members"
ON public.team_assignments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_assignments
    WHERE team_id = team_assignments.team_id
    AND user_id = auth.uid()
    AND team_admin = true
  )
);

-- Team admins can update team assignments
CREATE POLICY "Team admins can update members"
ON public.team_assignments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.team_assignments ta
    WHERE ta.team_id = team_assignments.team_id
    AND ta.user_id = auth.uid()
    AND ta.team_admin = true
  )
);

-- Team admins can delete team assignments
CREATE POLICY "Team admins can remove members"
ON public.team_assignments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.team_assignments ta
    WHERE ta.team_id = team_assignments.team_id
    AND ta.user_id = auth.uid()
    AND ta.team_admin = true
  )
);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_team_assignments_updated_at ON public.team_assignments;
CREATE TRIGGER update_team_assignments_updated_at
BEFORE UPDATE ON public.team_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Enable RLS if not already enabled
ALTER TABLE public.collaborator_configurations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Team admins can create configurations" ON public.collaborator_configurations;
DROP POLICY IF EXISTS "Team admins can view their team configurations" ON public.collaborator_configurations;
DROP POLICY IF EXISTS "Team admins can update their team configurations" ON public.collaborator_configurations;
DROP POLICY IF EXISTS "Team admins can delete their team configurations" ON public.collaborator_configurations;

-- Allow team admins to create configurations for their teams
CREATE POLICY "Team admins can create configurations" 
ON public.collaborator_configurations 
FOR INSERT 
TO authenticated
WITH CHECK (
  is_team_admin(auth.uid(), team_id)
);

-- Allow team admins to view configurations for their teams
CREATE POLICY "Team admins can view their team configurations" 
ON public.collaborator_configurations 
FOR SELECT 
TO authenticated
USING (
  is_team_admin(auth.uid(), team_id) OR is_team_member(auth.uid(), team_id)
);

-- Allow team admins to update configurations for their teams
CREATE POLICY "Team admins can update their team configurations" 
ON public.collaborator_configurations 
FOR UPDATE 
TO authenticated
USING (
  is_team_admin(auth.uid(), team_id)
)
WITH CHECK (
  is_team_admin(auth.uid(), team_id)
);

-- Allow team admins to delete configurations for their teams
CREATE POLICY "Team admins can delete their team configurations" 
ON public.collaborator_configurations 
FOR DELETE 
TO authenticated
USING (
  is_team_admin(auth.uid(), team_id)
);
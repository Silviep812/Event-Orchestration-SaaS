-- Create table for storing collaborator configurations/requirements
CREATE TABLE IF NOT EXISTS public.collaborator_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  collaborator_types TEXT[] NOT NULL,
  is_coordinator BOOLEAN DEFAULT false,
  is_viewer BOOLEAN DEFAULT false,
  assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collaborator_configurations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view collaborator configs for their own teams
DROP POLICY IF EXISTS "Users can view their team's collaborator configs" ON public.collaborator_configurations;
CREATE POLICY "Users can view their team's collaborator configs"
ON public.collaborator_configurations
FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM public.team_assignments WHERE user_id = auth.uid()
  )
);

-- Policy: Team admins can create collaborator configs
DROP POLICY IF EXISTS "Team admins can create collaborator configs" ON public.collaborator_configurations;
CREATE POLICY "Team admins can create collaborator configs"
ON public.collaborator_configurations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_assignments 
    WHERE user_id = auth.uid() 
    AND team_id = collaborator_configurations.team_id 
    AND team_admin = true
  )
);

-- Policy: Team admins can update collaborator configs
DROP POLICY IF EXISTS "Team admins can update collaborator configs" ON public.collaborator_configurations;
CREATE POLICY "Team admins can update collaborator configs"
ON public.collaborator_configurations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.team_assignments 
    WHERE user_id = auth.uid() 
    AND team_id = collaborator_configurations.team_id 
    AND team_admin = true
  )
);

-- Policy: Team admins can delete collaborator configs
DROP POLICY IF EXISTS "Team admins can delete collaborator configs" ON public.collaborator_configurations;
CREATE POLICY "Team admins can delete collaborator configs"
ON public.collaborator_configurations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.team_assignments 
    WHERE user_id = auth.uid() 
    AND team_id = collaborator_configurations.team_id 
    AND team_admin = true
  )
);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_collaborator_configurations_updated_at ON public.collaborator_configurations;
CREATE TRIGGER update_collaborator_configurations_updated_at
  BEFORE UPDATE ON public.collaborator_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
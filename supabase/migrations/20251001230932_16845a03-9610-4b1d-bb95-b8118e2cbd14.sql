-- Add role columns to team_assignments table
ALTER TABLE public.team_assignments
ADD COLUMN IF NOT EXISTS is_viewer boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS is_coordinator boolean DEFAULT false NOT NULL;
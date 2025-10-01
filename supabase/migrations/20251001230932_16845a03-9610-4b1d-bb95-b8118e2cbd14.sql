-- Add role columns to team_assignments table
ALTER TABLE public.team_assignments
ADD COLUMN is_viewer boolean DEFAULT false NOT NULL,
ADD COLUMN is_coordinator boolean DEFAULT false NOT NULL;
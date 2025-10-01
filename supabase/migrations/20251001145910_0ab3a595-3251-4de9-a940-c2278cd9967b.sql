-- Drop the assigned_role column from task_assignments
ALTER TABLE public.task_assignments DROP COLUMN IF EXISTS assigned_role;

-- Add user_id column to reference users
ALTER TABLE public.task_assignments ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
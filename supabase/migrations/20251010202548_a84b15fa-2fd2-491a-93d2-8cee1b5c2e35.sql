-- Drop the existing overly restrictive unique constraint
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Add a new unique constraint that includes event_id
-- This allows the same user to have the same role for different events
-- but prevents duplicate role assignments for the same user/role/event combination
-- We use COALESCE to handle NULL event_ids (global roles)
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_role_event_unique 
ON public.user_roles (user_id, role, COALESCE(event_id, '00000000-0000-0000-0000-000000000000'::uuid));
-- Drop the incorrect bootstrap policy
DROP POLICY IF EXISTS "Bootstrap: Allow first admin creation" ON public.user_roles;

-- Add correct bootstrap policy
-- This allows any authenticated user to assign roles if no admin-level users exist
CREATE POLICY "Bootstrap: Allow first admin role assignment"
ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.role_permission_groups rpg ON ur.role = rpg.role
    WHERE rpg.permission_group = 'admin'
  )
);
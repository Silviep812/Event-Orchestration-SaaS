-- Drop the current bootstrap policy
DROP POLICY IF EXISTS "Bootstrap: Allow first admin role assignment" ON public.user_roles;

-- Create a more permissive bootstrap policy
-- Allows any authenticated user to assign any role to any user when no admin-level roles exist
CREATE POLICY "Bootstrap: Allow role assignment when no admin exists"
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

-- Also add a policy to allow updates during bootstrap
CREATE POLICY "Bootstrap: Allow role updates when no admin exists"
ON public.user_roles
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.role_permission_groups rpg ON ur.role = rpg.role
    WHERE rpg.permission_group = 'admin'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.role_permission_groups rpg ON ur.role = rpg.role
    WHERE rpg.permission_group = 'admin'
  )
);
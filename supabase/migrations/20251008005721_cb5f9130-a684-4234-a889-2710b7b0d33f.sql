-- Drop the current bootstrap policies
DROP POLICY IF EXISTS "Bootstrap: Allow role assignment when no admin exists" ON public.user_roles;
DROP POLICY IF EXISTS "Bootstrap: Allow role updates when no admin exists" ON public.user_roles;
DROP POLICY IF EXISTS "Bootstrap: Allow role assignment for non-admin users" ON public.user_roles;
DROP POLICY IF EXISTS "Bootstrap: Allow role updates for non-admin users" ON public.user_roles;

-- Create improved bootstrap policy
-- Allows any authenticated user to assign roles if THEY don't have admin permissions yet
CREATE POLICY "Bootstrap: Allow role assignment for non-admin users"
ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND NOT public.policy_has_permission_level(auth.uid(), 'admin'::public.permission_level)
);

-- Allow updates for non-admin users during bootstrap
CREATE POLICY "Bootstrap: Allow role updates for non-admin users"
ON public.user_roles
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND NOT public.policy_has_permission_level(auth.uid(), 'admin'::public.permission_level)
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND NOT public.policy_has_permission_level(auth.uid(), 'admin'::public.permission_level)
);
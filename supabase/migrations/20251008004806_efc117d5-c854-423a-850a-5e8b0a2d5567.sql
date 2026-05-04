-- Create RLS policies for user_roles table
-- Use public.policy_has_permission_level (see 20251007151216) to avoid overload ambiguity.

DROP POLICY IF EXISTS "Admins can view all role assignments" ON public.user_roles;
CREATE POLICY "Admins can view all role assignments"
ON public.user_roles
FOR SELECT
USING (public.policy_has_permission_level(auth.uid(), 'admin'::public.permission_level));

DROP POLICY IF EXISTS "Admins can insert role assignments" ON public.user_roles;
CREATE POLICY "Admins can insert role assignments"
ON public.user_roles
FOR INSERT
WITH CHECK (public.policy_has_permission_level(auth.uid(), 'admin'::public.permission_level));

DROP POLICY IF EXISTS "Admins can update role assignments" ON public.user_roles;
CREATE POLICY "Admins can update role assignments"
ON public.user_roles
FOR UPDATE
USING (public.policy_has_permission_level(auth.uid(), 'admin'::public.permission_level))
WITH CHECK (public.policy_has_permission_level(auth.uid(), 'admin'::public.permission_level));

DROP POLICY IF EXISTS "Admins can delete role assignments" ON public.user_roles;
CREATE POLICY "Admins can delete role assignments"
ON public.user_roles
FOR DELETE
USING (public.policy_has_permission_level(auth.uid(), 'admin'::public.permission_level));

DROP POLICY IF EXISTS "Users can view their own role assignments" ON public.user_roles;
CREATE POLICY "Users can view their own role assignments"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

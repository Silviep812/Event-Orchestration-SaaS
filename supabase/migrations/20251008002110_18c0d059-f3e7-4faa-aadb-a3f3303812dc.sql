-- Add policies for role assignment functionality
-- Use public.policy_has_min_permission_level (see 20251007151216) to avoid overload ambiguity
-- once has_min_permission_level gains a default third argument in 20251008012430.

DROP POLICY IF EXISTS "coordinators_can_insert_roles" ON public.user_roles;
CREATE POLICY "coordinators_can_insert_roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level));

DROP POLICY IF EXISTS "coordinators_can_update_roles" ON public.user_roles;
CREATE POLICY "coordinators_can_update_roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level))
WITH CHECK (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level));

DROP POLICY IF EXISTS "coordinators_can_delete_roles" ON public.user_roles;
CREATE POLICY "coordinators_can_delete_roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level));

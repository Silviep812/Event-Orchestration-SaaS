
DROP POLICY IF EXISTS "Authenticated users can insert Marketing Directory" ON public."Marketing Directory";
DROP POLICY IF EXISTS "Authenticated users can update Marketing Directory" ON public."Marketing Directory";
DROP POLICY IF EXISTS "Authenticated users can delete Marketing Directory" ON public."Marketing Directory";

CREATE POLICY "Coordinators can insert Marketing Directory"
ON public."Marketing Directory" FOR INSERT TO authenticated
WITH CHECK (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level));

CREATE POLICY "Coordinators can update Marketing Directory"
ON public."Marketing Directory" FOR UPDATE TO authenticated
USING (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level))
WITH CHECK (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level));

CREATE POLICY "Admins can delete Marketing Directory"
ON public."Marketing Directory" FOR DELETE TO authenticated
USING (public.policy_has_permission_level(auth.uid(), 'admin'::public.permission_level));

DROP POLICY IF EXISTS "Authenticated users can insert marketing profiles" ON public."Marketing Profile";
DROP POLICY IF EXISTS "Authenticated users can update marketing profiles" ON public."Marketing Profile";
DROP POLICY IF EXISTS "Authenticated users can delete marketing profiles" ON public."Marketing Profile";

CREATE POLICY "Coordinators can insert Marketing Profile"
ON public."Marketing Profile" FOR INSERT TO authenticated
WITH CHECK (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level));

CREATE POLICY "Coordinators can update Marketing Profile"
ON public."Marketing Profile" FOR UPDATE TO authenticated
USING (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level))
WITH CHECK (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level));

CREATE POLICY "Admins can delete Marketing Profile"
ON public."Marketing Profile" FOR DELETE TO authenticated
USING (public.policy_has_permission_level(auth.uid(), 'admin'::public.permission_level));

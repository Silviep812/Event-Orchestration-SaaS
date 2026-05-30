
-- 1. Collaborators: replace wide-open SELECT with admin-only (table has no user/event link)
DROP POLICY IF EXISTS "Authenticated users can view collaborators" ON public."Collaborators";
CREATE POLICY "Admins can view collaborators"
  ON public."Collaborators" FOR SELECT
  USING (public.has_permission_level(auth.uid(), 'admin'::permission_level));

-- 2. Communication Hub: restrict SELECT to admins/coordinators (no event link in table)
DROP POLICY IF EXISTS "Authenticated users can view communication hub" ON public."Communication Hub";
CREATE POLICY "Coordinators can view communication hub"
  ON public."Communication Hub" FOR SELECT
  USING (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::permission_level));

DROP POLICY IF EXISTS "Authenticated users can create communication hub entries" ON public."Communication Hub";
CREATE POLICY "Coordinators can create communication hub entries"
  ON public."Communication Hub" FOR INSERT
  WITH CHECK (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::permission_level));

-- 3. Event Resources: restrict to event owner (join via integer event_id is not possible against uuid events table; fall back to admin/coordinator)
DROP POLICY IF EXISTS "Authenticated users can view event resources" ON public."Event Resources";
CREATE POLICY "Coordinators can view event resources"
  ON public."Event Resources" FOR SELECT
  USING (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::permission_level));

-- 4. Manage Event: tighten coordinator UPDATE to row owner OR admin
DROP POLICY IF EXISTS "Coordinators can update managed events" ON public."Manage Event";
CREATE POLICY "Coordinators can update own managed events"
  ON public."Manage Event" FOR UPDATE
  USING (
    public.has_permission_level(auth.uid(), 'admin'::permission_level)
    OR (
      public.policy_has_min_permission_level(auth.uid(), 'coordinator'::permission_level)
      AND event_user_id = (auth.uid())::text
    )
  )
  WITH CHECK (
    public.has_permission_level(auth.uid(), 'admin'::permission_level)
    OR (
      public.policy_has_min_permission_level(auth.uid(), 'coordinator'::permission_level)
      AND event_user_id = (auth.uid())::text
    )
  );

-- 5. Create Event: tighten coordinator UPDATE to row owner OR admin
DROP POLICY IF EXISTS "Coordinators can update events" ON public."Create Event";
CREATE POLICY "Coordinators can update own events"
  ON public."Create Event" FOR UPDATE
  USING (
    public.has_permission_level(auth.uid(), 'admin'::permission_level)
    OR (
      public.policy_has_min_permission_level(auth.uid(), 'coordinator'::permission_level)
      AND userid = (auth.uid())::text
    )
  )
  WITH CHECK (
    public.has_permission_level(auth.uid(), 'admin'::permission_level)
    OR (
      public.policy_has_min_permission_level(auth.uid(), 'coordinator'::permission_level)
      AND userid = (auth.uid())::text
    )
  );

-- 6. change_requests: drop duplicate cr_update_own policies and consolidate into a single, strict UPDATE policy
DROP POLICY IF EXISTS "cr_update_own" ON public.change_requests;
CREATE POLICY "change_requests_update_own_scoped"
  ON public.change_requests FOR UPDATE
  USING (
    (requested_by)::text = (auth.uid())::text
    AND event_id IS NOT NULL
    AND (
      EXISTS (SELECT 1 FROM public.events e WHERE (e.id)::text = change_requests.event_id AND (e.user_id)::text = (auth.uid())::text)
      OR EXISTS (SELECT 1 FROM public.cm_event_members m WHERE (m.user_id)::text = (auth.uid())::text AND (m.event_id)::text = change_requests.event_id)
    )
  )
  WITH CHECK (
    (requested_by)::text = (auth.uid())::text
    AND event_id IS NOT NULL
    AND (
      EXISTS (SELECT 1 FROM public.events e WHERE (e.id)::text = change_requests.event_id AND (e.user_id)::text = (auth.uid())::text)
      OR EXISTS (SELECT 1 FROM public.cm_event_members m WHERE (m.user_id)::text = (auth.uid())::text AND (m.event_id)::text = change_requests.event_id)
    )
  );

-- 7. transportations: restrict mutations to coordinators+ (directory has no per-row owner column)
DROP POLICY IF EXISTS "Authenticated users can insert transportations" ON public.transportations;
DROP POLICY IF EXISTS "Authenticated users can update transportations" ON public.transportations;
DROP POLICY IF EXISTS "Authenticated users can delete transportations" ON public.transportations;
DROP POLICY IF EXISTS "transportations_insert_authenticated" ON public.transportations;
DROP POLICY IF EXISTS "transportations_update_authenticated" ON public.transportations;
DROP POLICY IF EXISTS "transportations_delete_authenticated" ON public.transportations;

CREATE POLICY "Coordinators can insert transportations"
  ON public.transportations FOR INSERT
  WITH CHECK (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::permission_level));

CREATE POLICY "Coordinators can update transportations"
  ON public.transportations FOR UPDATE
  USING (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::permission_level))
  WITH CHECK (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::permission_level));

CREATE POLICY "Admins can delete transportations"
  ON public.transportations FOR DELETE
  USING (public.has_permission_level(auth.uid(), 'admin'::permission_level));

-- cm_change_requests: split RLS so collaborators can read/update open own requests,
-- while approve/reject (status transitions, resolved_*) is limited to event owners and coordinators/admins.

ALTER TABLE public.cm_change_requests ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'cm_change_requests'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.cm_change_requests', r.policyname);
  END LOOP;
END $$;

-- Read: requester, event owner, event members, coordinators/admins (incl. global roles)
CREATE POLICY cm_cr_select_scoped ON public.cm_change_requests
FOR SELECT
TO authenticated
USING (
  requested_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id = cm_change_requests.event_id
      AND e.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.cm_event_members m
    WHERE m.user_id = auth.uid()
      AND m.event_id = cm_change_requests.event_id
  )
  OR public.has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level, cm_change_requests.event_id)
  OR public.has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level, NULL::uuid)
  OR public.has_permission_level(auth.uid(), 'admin'::public.permission_level)
);

-- Create: must be the requester and scoped to the event
CREATE POLICY cm_cr_insert_scoped ON public.cm_change_requests
FOR INSERT
TO authenticated
WITH CHECK (
  requested_by = auth.uid()
  AND (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = cm_change_requests.event_id
        AND e.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.cm_event_members m
      WHERE m.user_id = auth.uid()
        AND m.event_id = cm_change_requests.event_id
    )
    OR public.has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level, cm_change_requests.event_id)
    OR public.has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level, NULL::uuid)
    OR public.has_permission_level(auth.uid(), 'admin'::public.permission_level)
  )
);

-- Approve / reject / full update: event owner or coordinator+ (matches Business Guidelines)
CREATE POLICY cm_cr_update_coordinator ON public.cm_change_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id = cm_change_requests.event_id
      AND e.user_id = auth.uid()
  )
  OR public.has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level, cm_change_requests.event_id)
  OR public.has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level, NULL::uuid)
  OR public.has_permission_level(auth.uid(), 'admin'::public.permission_level)
)
WITH CHECK (true);

-- Collaborator / requester: edit own open request only; cannot self-approve (status must stay open/pending or cancel)
CREATE POLICY cm_cr_update_requester_open ON public.cm_change_requests
FOR UPDATE
TO authenticated
USING (
  requested_by = auth.uid()
  AND coalesce(cm_change_requests.status, 'open'::text) IN ('open', 'pending')
)
WITH CHECK (
  requested_by = auth.uid()
  AND (
    (
      coalesce(cm_change_requests.status, 'open'::text) IN ('open', 'pending')
      AND cm_change_requests.resolved_by IS NULL
      AND cm_change_requests.resolved_at IS NULL
    )
    OR coalesce(cm_change_requests.status, '') = 'cancelled'
  )
);

REVOKE ALL ON public.cm_change_requests FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.cm_change_requests TO authenticated;

NOTIFY pgrst, 'reload schema';

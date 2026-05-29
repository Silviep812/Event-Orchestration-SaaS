-- Invoices: only service_role/edge functions may UPDATE; revoke user self-update
DROP POLICY IF EXISTS invoices_update_own ON public.invoices;

-- Venues: drop legacy NULL-owner insert policy (stricter policy already exists)
DROP POLICY IF EXISTS "Users can create venues" ON public.venues;

-- discussion_comments: require event-scoped coordinator (not global NULL-event role)
DROP POLICY IF EXISTS "Users read scoped discussion comments" ON public.discussion_comments;
CREATE POLICY "Users read scoped discussion comments"
ON public.discussion_comments
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_permission_level(auth.uid(), 'admin'::permission_level)
  OR (
    entity_type = 'event'
    AND entity_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND (
      public.user_is_member_of_event(entity_id::uuid)
      OR public.has_min_permission_level(auth.uid(), 'coordinator'::permission_level, entity_id::uuid)
    )
  )
);

-- cm_change_requests: drop the global NULL-event coordinator branch in select/update
DROP POLICY IF EXISTS cm_cr_select_scoped ON public.cm_change_requests;
CREATE POLICY cm_cr_select_scoped
ON public.cm_change_requests
FOR SELECT
TO authenticated
USING (
  requested_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = cm_change_requests.event_id AND e.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.cm_event_members m WHERE m.user_id = auth.uid() AND m.event_id = cm_change_requests.event_id)
  OR public.has_min_permission_level(auth.uid(), 'coordinator'::permission_level, event_id)
  OR public.has_permission_level(auth.uid(), 'admin'::permission_level)
);

DROP POLICY IF EXISTS cm_cr_update_coordinator ON public.cm_change_requests;
CREATE POLICY cm_cr_update_coordinator
ON public.cm_change_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = cm_change_requests.event_id AND e.user_id = auth.uid())
  OR public.has_min_permission_level(auth.uid(), 'coordinator'::permission_level, event_id)
  OR public.has_permission_level(auth.uid(), 'admin'::permission_level)
)
WITH CHECK (
  (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = cm_change_requests.event_id AND e.user_id = auth.uid())
    OR public.has_min_permission_level(auth.uid(), 'coordinator'::permission_level, event_id)
    OR public.has_permission_level(auth.uid(), 'admin'::permission_level)
  )
  AND requested_by = (SELECT x.requested_by FROM public.cm_change_requests x WHERE x.id = cm_change_requests.id)
  AND NOT (event_id IS DISTINCT FROM (SELECT x.event_id FROM public.cm_change_requests x WHERE x.id = cm_change_requests.id))
);

-- Also drop the matching INSERT global-coord branch
DROP POLICY IF EXISTS cm_cr_insert_scoped ON public.cm_change_requests;
CREATE POLICY cm_cr_insert_scoped
ON public.cm_change_requests
FOR INSERT
TO authenticated
WITH CHECK (
  requested_by = auth.uid()
  AND (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = cm_change_requests.event_id AND e.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.cm_event_members m WHERE m.user_id = auth.uid() AND m.event_id = cm_change_requests.event_id)
    OR public.has_min_permission_level(auth.uid(), 'coordinator'::permission_level, event_id)
    OR public.has_permission_level(auth.uid(), 'admin'::permission_level)
  )
);
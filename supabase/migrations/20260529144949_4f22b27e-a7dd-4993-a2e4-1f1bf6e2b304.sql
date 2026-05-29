-- =====================================================================
-- Security hardening round 2 (retry: use permission_level enum for admin)
-- =====================================================================

DROP POLICY IF EXISTS cm_cr_update_requester_open ON public.cm_change_requests;
CREATE POLICY cm_cr_update_requester_open
ON public.cm_change_requests
FOR UPDATE
TO authenticated
USING (
  requested_by = auth.uid()
  AND COALESCE(status, 'open'::text) = ANY (ARRAY['open'::text, 'pending'::text])
)
WITH CHECK (
  requested_by = auth.uid()
  AND NOT (event_id IS DISTINCT FROM (SELECT x.event_id FROM public.cm_change_requests x WHERE x.id = cm_change_requests.id))
  AND (
    (COALESCE(status, 'open'::text) = ANY (ARRAY['open'::text, 'pending'::text]) AND resolved_by IS NULL AND resolved_at IS NULL)
    OR COALESCE(status, ''::text) = 'cancelled'::text
  )
);

DROP POLICY IF EXISTS "Authenticated users can read discussion comments" ON public.discussion_comments;
CREATE POLICY "Users read scoped discussion comments"
ON public.discussion_comments
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_min_permission_level(auth.uid(), 'coordinator'::permission_level)
  OR (
    entity_type = 'event'
    AND entity_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.user_is_member_of_event(entity_id::uuid)
  )
);

DROP POLICY IF EXISTS "Authenticated users can update teams" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users can delete teams" ON public.teams;

CREATE POLICY "Team admins can update teams"
ON public.teams
FOR UPDATE
TO authenticated
USING (public.is_team_admin(auth.uid(), id) OR public.has_permission_level(auth.uid(), 'admin'::permission_level))
WITH CHECK (public.is_team_admin(auth.uid(), id) OR public.has_permission_level(auth.uid(), 'admin'::permission_level));

CREATE POLICY "Team admins can delete teams"
ON public.teams
FOR DELETE
TO authenticated
USING (public.is_team_admin(auth.uid(), id) OR public.has_permission_level(auth.uid(), 'admin'::permission_level));

DROP POLICY IF EXISTS "Anyone can view collaborators directory" ON public."Collaborators";
CREATE POLICY "Authenticated users can view collaborators"
ON public."Collaborators"
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can view event resources" ON public."Event Resources";
CREATE POLICY "Authenticated users can view event resources"
ON public."Event Resources"
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anon can view transportations (directory)" ON public.transportations;

DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;
CREATE POLICY "Users view own avatar folder"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

ALTER FUNCTION public.generate_invoice_number() SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'apply_change_request(uuid, uuid)',
    'apply_multilocation_change_request(uuid, uuid)',
    'approve_change_request(uuid, uuid)',
    'reject_change_request(uuid, text, uuid)',
    'cancel_change_request(uuid, uuid)',
    'cm_activity_log_event()',
    'cm_activity_log_task()',
    'create_approval_task_on_change_request()',
    'handle_new_user_profile()',
    'handle_task_estimate_change()',
    'handle_updated_at()',
    'log_budget_item_changes()',
    'log_change_request_changes()',
    'log_task_changes()',
    'refresh_mv_daily_activity()',
    'workflow_analytics_refresh_all()',
    'scrub_authorization_sensitive_fields()',
    'set_user_profile_user_id()',
    'sync_create_event_to_manage_event()',
    'sync_downstream_on_change_applied()',
    'trg_block_requester_approval_fields()',
    'trg_change_requests_lock_requested_by()'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM anon, authenticated, PUBLIC', fn);
    EXCEPTION WHEN undefined_function THEN
      NULL;
    END;
  END LOOP;
END$$;
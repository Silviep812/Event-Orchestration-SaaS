
-- 1. Comments: drop blanket authenticated SELECT
DROP POLICY IF EXISTS "Authenticated users can view comments" ON public."Comments";

-- 2. change_requests (public): restrict WITH CHECK on cr_update_own to enforce event scope
DROP POLICY IF EXISTS "cr_update_own" ON public.change_requests;
CREATE POLICY "cr_update_own" ON public.change_requests
FOR UPDATE
USING ((requested_by)::text = (auth.uid())::text)
WITH CHECK (
  (requested_by)::text = (auth.uid())::text
  AND event_id IS NOT NULL
  AND (
    EXISTS (SELECT 1 FROM public.events e WHERE (e.id)::text = change_requests.event_id AND (e.user_id)::text = (auth.uid())::text)
    OR EXISTS (SELECT 1 FROM public.cm_event_members m WHERE (m.user_id)::text = (auth.uid())::text AND (m.event_id)::text = change_requests.event_id)
  )
);

-- Same fix for the other schemas if those tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='event_orchestration_saas' AND table_name='change_requests') THEN
    EXECUTE 'DROP POLICY IF EXISTS "cr_update_own" ON event_orchestration_saas.change_requests';
    EXECUTE $p$CREATE POLICY "cr_update_own" ON event_orchestration_saas.change_requests
      FOR UPDATE USING ((SELECT auth.uid()) = requested_by)
      WITH CHECK (
        (SELECT auth.uid()) = requested_by
        AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = (SELECT auth.uid()) AND (ur.event_id = change_requests.event_id OR change_requests.event_id IS NULL))
      )$p$;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='Cm_Event_Orchestration' AND table_name='change_requests') THEN
    EXECUTE 'DROP POLICY IF EXISTS "cr_update_own" ON "Cm_Event_Orchestration".change_requests';
    EXECUTE $p$CREATE POLICY "cr_update_own" ON "Cm_Event_Orchestration".change_requests
      FOR UPDATE USING ((SELECT auth.uid()) = requested_by)
      WITH CHECK (
        (SELECT auth.uid()) = requested_by
        AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = (SELECT auth.uid()) AND (ur.event_id = change_requests.event_id OR change_requests.event_id IS NULL))
      )$p$;
  END IF;
END$$;

-- 3. Manage Event Tasks: drop overly broad role-only policies; keep met_*_scoped
DROP POLICY IF EXISTS "Coordinators can view manage event tasks" ON public."Manage Event Tasks";
DROP POLICY IF EXISTS "Coordinators can insert manage event tasks" ON public."Manage Event Tasks";
DROP POLICY IF EXISTS "Coordinators can update manage event tasks" ON public."Manage Event Tasks";
DROP POLICY IF EXISTS "Admins and managers can delete manage event tasks" ON public."Manage Event Tasks";

-- 4. Comment attachments: make private and scope SELECT to uploader/admin/coordinator
UPDATE storage.buckets SET public = false WHERE id = 'comment-attachments';
DROP POLICY IF EXISTS "Anyone can view comment attachments" ON storage.objects;
CREATE POLICY "Comment attachments viewable by uploader or admin/coordinator"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'comment-attachments'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR public.has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level)
  )
);

-- Lovable "Try to fix all" can add policies like cr_update_own with WITH CHECK (true) on
-- cm_change_requests. Those stack with cm_change_requests_scoped (PERMISSIVE OR) and weaken updates.
-- Drop any policy whose name starts with cr_; recreate scoped policy if missing.

DO $$
DECLARE
  r RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cm_change_requests'
  ) THEN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cm_change_requests'
      AND policyname ~ '^cr_'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.cm_change_requests', r.policyname);
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cm_change_requests'
      AND policyname = 'cm_change_requests_scoped'
  ) THEN
    EXECUTE 'ALTER TABLE public.cm_change_requests ENABLE ROW LEVEL SECURITY';
    EXECUTE $p$
      CREATE POLICY cm_change_requests_scoped ON public.cm_change_requests
      FOR ALL TO authenticated
      USING (
        requested_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = cm_change_requests.event_id AND e.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.cm_event_members m
          WHERE m.user_id = auth.uid() AND m.event_id = cm_change_requests.event_id
        )
      )
      WITH CHECK (
        requested_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = cm_change_requests.event_id AND e.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.cm_event_members m
          WHERE m.user_id = auth.uid() AND m.event_id = cm_change_requests.event_id
        )
      )
    $p$;
  END IF;

  REVOKE ALL ON public.cm_change_requests FROM anon;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

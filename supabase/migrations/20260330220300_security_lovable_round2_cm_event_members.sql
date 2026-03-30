-- Lovable round 2 (4/5): cm_event_members SELECT scoped to shared events

DO $$
DECLARE
  r RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cm_event_members'
  ) THEN
    ALTER TABLE public.cm_event_members ENABLE ROW LEVEL SECURITY;
    FOR r IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'cm_event_members'
        AND cmd = 'SELECT'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.cm_event_members', r.policyname);
    END LOOP;

    EXECUTE $p$
      CREATE POLICY cm_event_members_select_scoped
      ON public.cm_event_members
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.cm_event_members m
          WHERE m.user_id = auth.uid()
            AND m.event_id = cm_event_members.event_id
        )
      )
    $p$;
  END IF;
END $$;

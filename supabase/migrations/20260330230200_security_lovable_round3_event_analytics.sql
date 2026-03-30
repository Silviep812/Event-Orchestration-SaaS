-- Lovable round 3 (3/5): "Event Analytics" — scope to event owner or cm_event_members
--
-- cm_event_members branch MUST NOT use "m.event_id = ... event_id ..." with an unqualified
-- event_id: Postgres binds event_id to m.event_id (self-compare). Use nested EXISTS + ea.ctid = "Event Analytics".ctid.

DO $$
DECLARE
  r RECORD;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Event Analytics'
  ) THEN
    NULL;
  ELSE
    EXECUTE 'ALTER TABLE public."Event Analytics" ENABLE ROW LEVEL SECURITY';

    FOR r IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'Event Analytics'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public."Event Analytics"', r.policyname);
    END LOOP;

    EXECUTE $p$
      CREATE POLICY event_analytics_select_scoped
      ON public."Event Analytics"
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.user_id::text = auth.uid()::text
            AND e.id::text = trim(both from public."Event Analytics".event_id::text)
        )
        OR EXISTS (
          SELECT 1
          FROM public.cm_event_members mem
          WHERE mem.user_id::text = auth.uid()::text
            AND EXISTS (
              SELECT 1
              FROM public."Event Analytics" ea
              WHERE ea.ctid = "Event Analytics".ctid
                AND mem.event_id::text = trim(both from ea.event_id::text)
            )
        )
      )
    $p$;

    EXECUTE $p$
      CREATE POLICY event_analytics_insert_scoped
      ON public."Event Analytics"
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.user_id::text = auth.uid()::text
            AND e.id::text = trim(both from public."Event Analytics".event_id::text)
        )
        OR EXISTS (
          SELECT 1
          FROM public.cm_event_members mem
          WHERE mem.user_id::text = auth.uid()::text
            AND EXISTS (
              SELECT 1
              FROM public."Event Analytics" ea
              WHERE ea.ctid = "Event Analytics".ctid
                AND mem.event_id::text = trim(both from ea.event_id::text)
            )
        )
      )
    $p$;

    EXECUTE $p$
      CREATE POLICY event_analytics_update_scoped
      ON public."Event Analytics"
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.user_id::text = auth.uid()::text
            AND e.id::text = trim(both from public."Event Analytics".event_id::text)
        )
        OR EXISTS (
          SELECT 1
          FROM public.cm_event_members mem
          WHERE mem.user_id::text = auth.uid()::text
            AND EXISTS (
              SELECT 1
              FROM public."Event Analytics" ea
              WHERE ea.ctid = "Event Analytics".ctid
                AND mem.event_id::text = trim(both from ea.event_id::text)
            )
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.user_id::text = auth.uid()::text
            AND e.id::text = trim(both from public."Event Analytics".event_id::text)
        )
        OR EXISTS (
          SELECT 1
          FROM public.cm_event_members mem
          WHERE mem.user_id::text = auth.uid()::text
            AND EXISTS (
              SELECT 1
              FROM public."Event Analytics" ea
              WHERE ea.ctid = "Event Analytics".ctid
                AND mem.event_id::text = trim(both from ea.event_id::text)
            )
        )
      )
    $p$;

    EXECUTE $p$
      CREATE POLICY event_analytics_delete_scoped
      ON public."Event Analytics"
      FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.user_id::text = auth.uid()::text
            AND e.id::text = trim(both from public."Event Analytics".event_id::text)
        )
      )
    $p$;
  END IF;
END $$;

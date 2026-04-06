-- 1) cm_audit_events: INSERT policy must be TO authenticated, not public — otherwise
--    (event_id IS NULL) allows anon inserts. Aligns with Lovable security scan fix.
-- 2) activity_feed: plain CREATE OR REPLACE VIEW so static scanners see invoker/barrier
--    (view inherits RLS from public.cm_activity; not a table).

-- ─── cm_audit_events ───────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cm_audit_events'
  ) THEN
    ALTER TABLE public.cm_audit_events ENABLE ROW LEVEL SECURITY;

    REVOKE ALL ON public.cm_audit_events FROM anon;
    GRANT SELECT, INSERT ON public.cm_audit_events TO authenticated;

    DROP POLICY IF EXISTS "cm_audit_insert_contrib" ON public.cm_audit_events;
    DROP POLICY IF EXISTS "cm_audit_select_own_or_event" ON public.cm_audit_events;

    CREATE POLICY "cm_audit_select_own_or_event" ON public.cm_audit_events
      FOR SELECT TO authenticated
      USING (
        (user_id IS NOT NULL AND user_id::text = auth.uid()::text)
        OR EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id::text = cm_audit_events.event_id::text
            AND e.user_id::text = auth.uid()::text
        )
        OR (
          EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'cm_event_members'
          )
          AND EXISTS (
            SELECT 1 FROM public.cm_event_members em
            WHERE em.user_id::text = auth.uid()::text
              AND em.event_id::text = cm_audit_events.event_id::text
          )
        )
      );

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'cm_event_members'
    ) THEN
      CREATE POLICY "cm_audit_insert_contrib" ON public.cm_audit_events
        FOR INSERT TO authenticated
        WITH CHECK (
          (auth.uid() IS NOT NULL)
          AND (
            (event_id IS NULL)
            OR EXISTS (
              SELECT 1 FROM public.cm_event_members em
              WHERE em.user_id::text = auth.uid()::text
                AND em.event_id::text = cm_audit_events.event_id::text
                AND em.role = ANY (ARRAY['contributor'::text, 'manager'::text])
            )
          )
        );
    ELSE
      CREATE POLICY "cm_audit_insert_contrib" ON public.cm_audit_events
        FOR INSERT TO authenticated
        WITH CHECK (
          (auth.uid() IS NOT NULL)
          AND (
            (event_id IS NULL)
            OR EXISTS (
              SELECT 1 FROM public.events e
              WHERE e.id::text = cm_audit_events.event_id::text
                AND e.user_id::text = auth.uid()::text
            )
          )
        );
    END IF;
  END IF;
END $$;

-- ─── activity_feed (VIEW): explicit invoker + barrier in repo-visible DDL ──────
CREATE OR REPLACE VIEW public.activity_feed
WITH (security_invoker = true, security_barrier = true) AS
SELECT
  id,
  event_id,
  entity_type,
  entity_id,
  action,
  changed_by,
  metadata,
  created_at
FROM public.cm_activity;

REVOKE ALL ON public.activity_feed FROM anon;
GRANT SELECT ON public.activity_feed TO authenticated;

COMMENT ON VIEW public.activity_feed IS
  'SECURITY INVOKER view over public.cm_activity; row access follows cm_activity RLS.';

NOTIFY pgrst, 'reload schema';

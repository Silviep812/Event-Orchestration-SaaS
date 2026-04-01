-- Lovable security scan (2026): fixes for
-- 1) event_task_timeline_view — security_invoker (RLS on tasks/events applies)
-- 2) activity_feed — security_invoker on view (cm_activity RLS applies)
-- 3) team_admins — RLS + policy on table or invoker + RLS on view
-- 4) unified_tasks — security_invoker (tasks/events RLS applies)
-- 5) notifications — INSERT (and siblings) must be TO authenticated, not PUBLIC,
--    so anon cannot satisfy WITH CHECK (sender_id IS NULL).

-- ─── notifications: scope policies to authenticated; revoke anon ─────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.notifications FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
CREATE POLICY "Users can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  OR sender_id IS NULL
);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (recipient_id = auth.uid());

-- ─── Views: force security_invoker so underlying table RLS is enforced ───────
DO $$
DECLARE
  vname text;
BEGIN
  FOREACH vname IN ARRAY ARRAY[
    'event_task_timeline_view',
    'activity_feed',
    'unified_tasks',
    'unified_audit_events',
    'unified_resources'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = vname AND c.relkind = 'v'
    ) THEN
      EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', vname);
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', vname);
      EXECUTE format('GRANT SELECT ON public.%I TO authenticated', vname);
    END IF;
  END LOOP;
END $$;

-- ─── event_task_timeline_view: create if missing (invoker from CREATE in PG15+) ─
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'event_task_timeline_view' AND c.relkind = 'v'
  ) THEN
    EXECUTE $sql$
      CREATE VIEW public.event_task_timeline_view
      WITH (security_invoker = true) AS
      SELECT
        t.*,
        e.user_id AS event_owner_id,
        e.title AS event_title
      FROM public.tasks t
      INNER JOIN public.events e ON e.id = t.event_id
    $sql$;
    REVOKE ALL ON public.event_task_timeline_view FROM anon;
    GRANT SELECT ON public.event_task_timeline_view TO authenticated;
  END IF;
END $$;

-- ─── team_admins: table or view (same as security_lovable_round4) ────────────
DO $$
DECLARE
  rk char;
BEGIN
  SELECT c.relkind INTO rk
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'team_admins';

  IF rk = 'r' THEN
    ALTER TABLE public.team_admins ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS team_admins_select_own ON public.team_admins;
    CREATE POLICY team_admins_select_own
    ON public.team_admins
    FOR SELECT TO authenticated
    USING (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.team_assignments ta
        WHERE ta.team_id = team_admins.team_id AND ta.user_id = auth.uid()
      )
    );
    REVOKE ALL ON public.team_admins FROM anon;
    GRANT SELECT ON public.team_admins TO authenticated;
  ELSIF rk = 'v' THEN
    BEGIN
      EXECUTE 'ALTER VIEW public.team_admins SET (security_invoker = true)';
      EXECUTE 'ALTER VIEW public.team_admins ENABLE ROW LEVEL SECURITY';
      DROP POLICY IF EXISTS team_admins_select_own ON public.team_admins;
      CREATE POLICY team_admins_select_own
      ON public.team_admins
      FOR SELECT TO authenticated
      USING (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.team_assignments ta
          WHERE ta.team_id = team_admins.team_id AND ta.user_id = auth.uid()
        )
      );
      REVOKE ALL ON public.team_admins FROM anon;
      GRANT SELECT ON public.team_admins TO authenticated;
    EXCEPTION
      WHEN OTHERS THEN
        EXECUTE 'ALTER VIEW public.team_admins SET (security_invoker = true)';
    END;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

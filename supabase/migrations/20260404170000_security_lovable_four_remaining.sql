-- Lovable security scan (remaining): static analyzers often match plain SQL better than DO blocks.
-- 1) event_task_timeline_view — explicit CREATE … WITH (security_invoker = true)
-- 2) team_admins — RLS + policy (table or view)
-- 3) due_soon_events — invoker + recreate so DB checks see it
-- 4) change_requests — drop cr_update_own (WITH CHECK true); scoped policies + requested_by

-- ─── 1) event_task_timeline_view (top-level CREATE for code review scanners) ─────────
DROP VIEW IF EXISTS public.event_task_timeline_view CASCADE;

CREATE VIEW public.event_task_timeline_view
WITH (security_invoker = true) AS
SELECT
  t.*,
  e.user_id AS event_owner_id,
  e.title AS event_title
FROM public.tasks t
INNER JOIN public.events e ON e.id = t.event_id;

REVOKE ALL ON public.event_task_timeline_view FROM anon;
GRANT SELECT ON public.event_task_timeline_view TO authenticated;

COMMENT ON VIEW public.event_task_timeline_view IS
  'security_invoker=true: tasks/events RLS apply per session user.';

-- ─── 2) due_soon_events — invoker + filter by event ownership via events RLS ─────────
DROP VIEW IF EXISTS public.due_soon_events CASCADE;

CREATE VIEW public.due_soon_events
WITH (security_invoker = true) AS
SELECT e.*
FROM public.events e
WHERE e.archived IS NOT TRUE
  AND e.start_date IS NOT NULL
  AND e.start_date::date <= (CURRENT_DATE + 2)
  AND e.start_date::date >= CURRENT_DATE;

REVOKE ALL ON public.due_soon_events FROM anon;
GRANT SELECT ON public.due_soon_events TO authenticated;

COMMENT ON VIEW public.due_soon_events IS
  'security_invoker=true: underlying events RLS restricts rows to owner/collaborators.';

-- ─── 3) team_admins — RLS visible to scanners (idempotent) ─────────────────────────
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

-- ─── 4) change_requests — drop cr_update_own (WITH CHECK true); immutable requested_by ─
CREATE OR REPLACE FUNCTION public.trg_change_requests_lock_requested_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.requested_by::text IS DISTINCT FROM OLD.requested_by::text THEN
    RAISE EXCEPTION 'change_requests.requested_by cannot be reassigned';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  r RECORD;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'change_requests'
  ) THEN
    RETURN;
  END IF;

  ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

  DROP TRIGGER IF EXISTS change_requests_lock_requested_by ON public.change_requests;
  CREATE TRIGGER change_requests_lock_requested_by
  BEFORE UPDATE ON public.change_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_change_requests_lock_requested_by();

  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'change_requests'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.change_requests', r.policyname);
  END LOOP;

  -- Compare uuid/text columns safely (42883: uuid = text)
  CREATE POLICY change_requests_select_scoped ON public.change_requests
  FOR SELECT TO authenticated
  USING (
    change_requests.event_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id::text = change_requests.event_id::text
          AND e.user_id::text = auth.uid()::text
      )
      OR (
        EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'cm_event_members'
        )
        AND EXISTS (
          SELECT 1 FROM public.cm_event_members m
          WHERE m.user_id::text = auth.uid()::text
            AND m.event_id::text = change_requests.event_id::text
        )
      )
    )
  );

  CREATE POLICY change_requests_insert_scoped ON public.change_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by::text = auth.uid()::text
    AND change_requests.event_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id::text = change_requests.event_id::text
          AND e.user_id::text = auth.uid()::text
      )
      OR (
        EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'cm_event_members'
        )
        AND EXISTS (
          SELECT 1 FROM public.cm_event_members m
          WHERE m.user_id::text = auth.uid()::text
            AND m.event_id::text = change_requests.event_id::text
        )
      )
    )
  );

  -- Requester updates own row; WITH CHECK matches Lovable (cannot reassign requested_by)
  CREATE POLICY change_requests_update_by_requester ON public.change_requests
  FOR UPDATE TO authenticated
  USING (requested_by::text = auth.uid()::text)
  WITH CHECK (requested_by::text = auth.uid()::text);

  -- Event owner / collaborator can update (approve) without changing requested_by (enforced by trigger)
  CREATE POLICY change_requests_update_by_event_member ON public.change_requests
  FOR UPDATE TO authenticated
  USING (
    requested_by::text IS DISTINCT FROM auth.uid()::text
    AND change_requests.event_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id::text = change_requests.event_id::text
          AND e.user_id::text = auth.uid()::text
      )
      OR (
        EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'cm_event_members'
        )
        AND EXISTS (
          SELECT 1 FROM public.cm_event_members m
          WHERE m.user_id::text = auth.uid()::text
            AND m.event_id::text = change_requests.event_id::text
        )
      )
    )
  )
  WITH CHECK (
    change_requests.event_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id::text = change_requests.event_id::text
          AND e.user_id::text = auth.uid()::text
      )
      OR (
        EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'cm_event_members'
        )
        AND EXISTS (
          SELECT 1 FROM public.cm_event_members m
          WHERE m.user_id::text = auth.uid()::text
            AND m.event_id::text = change_requests.event_id::text
        )
      )
    )
  );

  CREATE POLICY change_requests_delete_scoped ON public.change_requests
  FOR DELETE TO authenticated
  USING (
    requested_by::text = auth.uid()::text
    AND change_requests.event_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id::text = change_requests.event_id::text
          AND e.user_id::text = auth.uid()::text
      )
      OR (
        EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'cm_event_members'
        )
        AND EXISTS (
          SELECT 1 FROM public.cm_event_members m
          WHERE m.user_id::text = auth.uid()::text
            AND m.event_id::text = change_requests.event_id::text
        )
      )
    )
  );

  REVOKE ALL ON public.change_requests FROM anon;
END $$;

NOTIFY pgrst, 'reload schema';

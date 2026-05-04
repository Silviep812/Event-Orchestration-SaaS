-- PDF / SOW alignment: change_logs → cm_change_logs, workflows column rename,
-- team_assignments.is_coordinator → is_collaborator, archive 2025 events,
-- drop legacy Registration, workflow_analytics MV + refresh, unified_* views.
-- Run order: publication DROP before RENAME so old table name still exists.

-- ────────────────────────────────────────────────────────────
-- 0) Realtime: detach change_logs before rename
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'change_logs'
     ) THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime DROP TABLE public.change_logs;
    EXCEPTION
      WHEN undefined_object THEN NULL;
      WHEN undefined_table THEN NULL;
    END;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 1) Rename change_logs → cm_change_logs
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'change_logs'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cm_change_logs'
  ) THEN
    ALTER TABLE public.change_logs RENAME TO cm_change_logs;
  END IF;
END $$;

-- log_change inserts into cm_change_logs
CREATE OR REPLACE FUNCTION public.log_change(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_field_name TEXT DEFAULT NULL,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.cm_change_logs (
    entity_type,
    entity_id,
    action,
    field_name,
    old_value,
    new_value,
    changed_by,
    change_description
  )
  VALUES (
    p_entity_type,
    p_entity_id,
    p_action,
    p_field_name,
    p_old_value,
    p_new_value,
    auth.uid(),
    p_description
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

-- Align RLS with 20260330190000 (full policy; replaces any duplicate-name issues after rename)
DO $$
DECLARE r RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cm_change_logs'
  ) THEN
    EXECUTE 'ALTER TABLE public.cm_change_logs ENABLE ROW LEVEL SECURITY';
    FOR r IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'cm_change_logs'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.cm_change_logs', r.policyname);
    END LOOP;
    EXECUTE $p$
      CREATE POLICY cm_change_logs_select_scoped ON public.cm_change_logs
      FOR SELECT TO authenticated
      USING (
        changed_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.user_id = auth.uid()
            AND (
              (entity_type = 'event' AND e.id = entity_id)
              OR (
                entity_type = 'task'
                AND (
                  EXISTS (
                    SELECT 1 FROM public.tasks t
                    WHERE t.id = entity_id AND t.event_id = e.id
                  )
                  OR EXISTS (
                    SELECT 1 FROM public.cm_tasks ct
                    WHERE ct.id = entity_id AND ct.event_id = e.id
                  )
                )
              )
              OR (
                entity_type = 'budget_item'
                AND EXISTS (
                  SELECT 1 FROM public.budget_items b
                  WHERE b.id = entity_id
                    AND EXISTS (
                      SELECT 1 FROM public.events ev
                      WHERE ev.id = b.event_id AND ev.user_id = auth.uid()
                    )
                )
              )
            )
        )
        OR EXISTS (
          SELECT 1 FROM public.cm_event_members m
          WHERE m.user_id = auth.uid()
            AND (
              (entity_type = 'event' AND m.event_id = entity_id)
              OR (
                entity_type = 'task'
                AND (
                  EXISTS (
                    SELECT 1 FROM public.tasks t
                    WHERE t.id = entity_id AND t.event_id = m.event_id
                  )
                  OR EXISTS (
                    SELECT 1 FROM public.cm_tasks ct
                    WHERE ct.id = entity_id AND ct.event_id = m.event_id
                  )
                )
              )
            )
        )
      )
    $p$;
    DROP POLICY IF EXISTS cm_change_logs_insert_own ON public.cm_change_logs;
    CREATE POLICY cm_change_logs_insert_own ON public.cm_change_logs
    FOR INSERT TO authenticated
    WITH CHECK (changed_by = auth.uid());
    REVOKE ALL ON public.cm_change_logs FROM anon;
  END IF;
END $$;

-- Re-attach realtime (skip if already a member)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'cm_change_logs'
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'cm_change_logs'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cm_change_logs;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 2) workflows.serv_vendor_sup_id → serv_vendor_id
-- Idempotent: some DBs already have serv_vendor_id (rename then fails with 42701).
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'serv_vendor_sup_id'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'serv_vendor_id'
  ) THEN
    ALTER TABLE public.workflows RENAME COLUMN serv_vendor_sup_id TO serv_vendor_id;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'serv_vendor_sup_id'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'serv_vendor_id'
  ) THEN
    UPDATE public.workflows
    SET serv_vendor_id = COALESCE(serv_vendor_id, serv_vendor_sup_id)
    WHERE serv_vendor_sup_id IS NOT NULL;
    ALTER TABLE public.workflows DROP COLUMN serv_vendor_sup_id CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'idx_workflows_serv_vendor_sup_id'
  )
  AND NOT EXISTS (
    SELECT 1 FROM pg_class c2
    JOIN pg_namespace n2 ON n2.oid = c2.relnamespace
    WHERE n2.nspname = 'public' AND c2.relname = 'idx_workflows_serv_vendor_id'
  ) THEN
    ALTER INDEX public.idx_workflows_serv_vendor_sup_id RENAME TO idx_workflows_serv_vendor_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'workflows_serv_vendor_sup_id_fkey'
  )
  AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workflows_serv_vendor_id_fkey'
  ) THEN
    ALTER TABLE public.workflows RENAME CONSTRAINT workflows_serv_vendor_sup_id_fkey TO workflows_serv_vendor_id_fkey;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 3) team_assignments.is_coordinator → is_collaborator
-- Idempotent: some DBs already have is_collaborator (20260329120000) while is_coordinator remains.
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'team_assignments' AND column_name = 'is_coordinator'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'team_assignments' AND column_name = 'is_collaborator'
  ) THEN
    ALTER TABLE public.team_assignments RENAME COLUMN is_coordinator TO is_collaborator;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'team_assignments' AND column_name = 'is_coordinator'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'team_assignments' AND column_name = 'is_collaborator'
  ) THEN
    UPDATE public.team_assignments
    SET is_collaborator = COALESCE(is_collaborator, false) OR COALESCE(is_coordinator, false);
    ALTER TABLE public.team_assignments DROP COLUMN is_coordinator;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 4) Archive events with start_date in calendar year 2025
-- ────────────────────────────────────────────────────────────
UPDATE public.events
SET archived = true
WHERE archived IS DISTINCT FROM true
  AND start_date IS NOT NULL
  AND EXTRACT(YEAR FROM (start_date::date)) = 2025;

-- ────────────────────────────────────────────────────────────
-- 5) Drop legacy Registration table
-- ────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public."Registration";

-- ────────────────────────────────────────────────────────────
-- 6) workflow_analytics schema + materialized view + refresh
-- ────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS workflow_analytics;
GRANT USAGE ON SCHEMA workflow_analytics TO authenticated;

DROP MATERIALIZED VIEW IF EXISTS workflow_analytics.event_task_metrics CASCADE;
CREATE MATERIALIZED VIEW workflow_analytics.event_task_metrics AS
SELECT
  e.id AS event_id,
  e.user_id,
  COUNT(t.id) AS task_count,
  COUNT(t.id) FILTER (WHERE t.status = 'completed') AS completed_task_count,
  COUNT(t.id) FILTER (WHERE t.status IN ('not_started', 'in_progress')) AS active_task_count
FROM public.events e
LEFT JOIN public.tasks t ON t.event_id = e.id
GROUP BY e.id, e.user_id;

CREATE UNIQUE INDEX IF NOT EXISTS workflow_analytics_event_task_metrics_event_id_idx
  ON workflow_analytics.event_task_metrics(event_id);

CREATE OR REPLACE FUNCTION workflow_analytics.refresh_all()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, workflow_analytics
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW workflow_analytics.event_task_metrics;
END;
$$;

GRANT SELECT ON workflow_analytics.event_task_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION workflow_analytics.refresh_all() TO service_role;

CREATE OR REPLACE FUNCTION public.workflow_analytics_refresh_all()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, workflow_analytics
AS $$
  SELECT workflow_analytics.refresh_all();
$$;

GRANT EXECUTE ON FUNCTION public.workflow_analytics_refresh_all() TO service_role;

-- ────────────────────────────────────────────────────────────
-- 7) Unified views (CM checklist)
-- DROP first: CREATE OR REPLACE cannot change column layout (42P16 source → id).
-- ────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.unified_tasks CASCADE;

CREATE VIEW public.unified_tasks AS
SELECT
  t.*,
  e.title AS event_title,
  e.user_id AS event_owner_id
FROM public.tasks t
INNER JOIN public.events e ON e.id = t.event_id;

ALTER VIEW public.unified_tasks SET (security_invoker = true);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cm_activity'
  ) THEN
    EXECUTE 'DROP VIEW IF EXISTS public.unified_audit_events CASCADE';
    EXECUTE $v$
      CREATE VIEW public.unified_audit_events AS
      SELECT
        a.id,
        a.created_at,
        a.event_id,
        a.entity_type,
        a.entity_id,
        a.action,
        a.changed_by,
        a.metadata
      FROM public.cm_activity a;
    $v$;
    EXECUTE 'ALTER VIEW public.unified_audit_events SET (security_invoker = true)';
    EXECUTE 'GRANT SELECT ON public.unified_audit_events TO authenticated';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cm_resources'
  ) THEN
    EXECUTE 'DROP VIEW IF EXISTS public.unified_resources CASCADE';
    EXECUTE $v$
      CREATE VIEW public.unified_resources AS
      SELECT
        r.id,
        r.event_id,
        r.name,
        r.role,
        r.availability,
        r.location_id,
        'cm_resources'::text AS source_kind
      FROM public.cm_resources r;
    $v$;
    EXECUTE 'ALTER VIEW public.unified_resources SET (security_invoker = true)';
    EXECUTE 'GRANT SELECT ON public.unified_resources TO authenticated';
  END IF;
END $$;

GRANT SELECT ON public.unified_tasks TO authenticated;

NOTIFY pgrst, 'reload schema';

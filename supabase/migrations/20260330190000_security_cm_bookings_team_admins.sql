-- Lovable security scan: cm_* tables, Bookings Directory, team_admins
-- Safe to re-run: DROP policies by name + dynamic drops where needed.

-- ────────────────────────────────────────────────────────────
-- Bookings Directory: remove blanket public read; owner-only access
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Enable read access for all users" ON public."Bookings Directory";
DROP POLICY IF EXISTS "Anyone can view bookings directory" ON public."Bookings Directory";

ALTER TABLE public."Bookings Directory" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own bookings" ON public."Bookings Directory";
CREATE POLICY "Users can view their own bookings"
ON public."Bookings Directory" FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own bookings" ON public."Bookings Directory";
CREATE POLICY "Users can create their own bookings"
ON public."Bookings Directory" FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own bookings" ON public."Bookings Directory";
CREATE POLICY "Users can update their own bookings"
ON public."Bookings Directory" FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookings" ON public."Bookings Directory";
CREATE POLICY "Users can delete their own bookings"
ON public."Bookings Directory" FOR DELETE TO authenticated
USING (auth.uid() = user_id);

REVOKE ALL ON public."Bookings Directory" FROM anon;

-- ────────────────────────────────────────────────────────────
-- cm_tasks: drop all policies, scope FOR ALL to event owner / members
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cm_tasks'
  ) THEN
    EXECUTE 'ALTER TABLE public.cm_tasks ENABLE ROW LEVEL SECURITY';
    FOR r IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'cm_tasks'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.cm_tasks', r.policyname);
    END LOOP;
    EXECUTE $p$
      CREATE POLICY cm_tasks_scoped ON public.cm_tasks
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = cm_tasks.event_id AND e.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.cm_event_members m
          WHERE m.user_id = auth.uid() AND m.event_id = cm_tasks.event_id
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = cm_tasks.event_id AND e.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.cm_event_members m
          WHERE m.user_id = auth.uid() AND m.event_id = cm_tasks.event_id
        )
      )
    $p$;
    REVOKE ALL ON public.cm_tasks FROM anon;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- cm_locations & cm_change_requests: authenticated + event scope (no anon)
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cm_locations'
  ) THEN
    EXECUTE 'ALTER TABLE public.cm_locations ENABLE ROW LEVEL SECURITY';
    FOR r IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'cm_locations'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.cm_locations', r.policyname);
    END LOOP;
    EXECUTE $p$
      CREATE POLICY cm_locations_scoped ON public.cm_locations
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = cm_locations.event_id AND e.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.cm_event_members m
          WHERE m.user_id = auth.uid() AND m.event_id = cm_locations.event_id
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = cm_locations.event_id AND e.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.cm_event_members m
          WHERE m.user_id = auth.uid() AND m.event_id = cm_locations.event_id
        )
      )
    $p$;
    REVOKE ALL ON public.cm_locations FROM anon;
  END IF;
END $$;

DO $$
DECLARE r RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cm_change_requests'
  ) THEN
    EXECUTE 'ALTER TABLE public.cm_change_requests ENABLE ROW LEVEL SECURITY';
    FOR r IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'cm_change_requests'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.cm_change_requests', r.policyname);
    END LOOP;
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
    REVOKE ALL ON public.cm_change_requests FROM anon;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- cm_change_logs: scope reads (actor or event membership)
-- ────────────────────────────────────────────────────────────
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
    REVOKE ALL ON public.cm_change_logs FROM anon;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- team_admins: table → RLS; view → security_invoker
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  rk char;
  r RECORD;
BEGIN
  SELECT c.relkind INTO rk
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'team_admins';

  IF rk = 'r' THEN
    ALTER TABLE public.team_admins ENABLE ROW LEVEL SECURITY;
    FOR r IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'team_admins'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.team_admins', r.policyname);
    END LOOP;
    CREATE POLICY team_admins_select_own
    ON public.team_admins FOR SELECT TO authenticated
    USING (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.team_assignments ta
        WHERE ta.team_id = team_admins.team_id AND ta.user_id = auth.uid()
      )
    );
    REVOKE ALL ON public.team_admins FROM anon;
  ELSIF rk = 'v' THEN
    EXECUTE 'ALTER VIEW public.team_admins SET (security_invoker = true)';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

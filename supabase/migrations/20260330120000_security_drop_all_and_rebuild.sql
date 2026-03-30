-- ============================================================
-- Security: Drop ALL existing policies on sensitive tables,
-- then rebuild with business-rule-aligned policies.
-- This handles any policy name mismatch from older migrations.
-- Safe to re-run.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Helper: drop every policy on a table dynamically
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'events'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.events', r.policyname);
  END LOOP;
END $$;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'User Profile'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public."User Profile"', r.policyname);
  END LOOP;
END $$;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tasks'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tasks', r.policyname);
  END LOOP;
END $$;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'budget_items'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.budget_items', r.policyname);
  END LOOP;
END $$;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'task_collaborator_assignments'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.task_collaborator_assignments', r.policyname);
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────
-- Fix has_permission_level: system-level check only matches
-- rows with event_id IS NULL (true system admins), preventing
-- "admin on my own event = admin everywhere" exploit.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.has_permission_level(
  _user_id  uuid,
  _level    permission_level,
  _event_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND permission_level = _level
      AND (
        (_event_id IS NULL     AND event_id IS NULL)
        OR
        (_event_id IS NOT NULL AND (event_id = _event_id OR event_id IS NULL))
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.has_min_permission_level(
  _user_id  uuid,
  _level    permission_level,
  _event_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        (_event_id IS NULL     AND event_id IS NULL)
        OR
        (_event_id IS NOT NULL AND (event_id = _event_id OR event_id IS NULL))
      )
      AND (
        permission_level = _level
        OR (_level = 'viewer'      AND permission_level IN ('coordinator', 'admin'))
        OR (_level = 'coordinator' AND permission_level = 'admin')
      )
  )
$$;

-- ────────────────────────────────────────────────────────────
-- EVENTS: owner CRUD + collaborator SELECT + system admin
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select_events"
ON public.events FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "owner_insert_events"
ON public.events FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "owner_update_events"
ON public.events FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "owner_delete_events"
ON public.events FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "collaborator_select_events"
ON public.events FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id  = auth.uid()
      AND ur.event_id = events.id
  )
);

CREATE POLICY "sysadmin_select_events"
ON public.events FOR SELECT TO authenticated
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

CREATE POLICY "sysadmin_delete_events"
ON public.events FOR DELETE TO authenticated
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

-- ────────────────────────────────────────────────────────────
-- USER PROFILE: own row only; system admin reads all
-- ────────────────────────────────────────────────────────────
ALTER TABLE public."User Profile" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile_select"
ON public."User Profile" FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "own_profile_update"
ON public."User Profile" FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "sysadmin_profile_select"
ON public."User Profile" FOR SELECT TO authenticated
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

-- ────────────────────────────────────────────────────────────
-- TASKS: event owner CRUD; collaborator R+U on assigned tasks
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_owner_all_tasks"
ON public.tasks FOR ALL TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = tasks.event_id AND e.user_id = auth.uid()
  )
)
WITH CHECK (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = tasks.event_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "collaborator_select_tasks"
ON public.tasks FOR SELECT TO authenticated
USING (
  assigned_to = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id  = auth.uid()
      AND ur.event_id = tasks.event_id
  )
);

CREATE POLICY "collaborator_update_assigned_tasks"
ON public.tasks FOR UPDATE TO authenticated
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());

-- ────────────────────────────────────────────────────────────
-- BUDGET ITEMS: event owner CRUD; collaborator SELECT only
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_owner_all_budget"
ON public.budget_items FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = budget_items.event_id AND e.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = budget_items.event_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "collaborator_select_budget"
ON public.budget_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id  = auth.uid()
      AND ur.event_id = budget_items.event_id
  )
);

CREATE POLICY "sysadmin_all_budget"
ON public.budget_items FOR ALL TO authenticated
USING  (has_permission_level(auth.uid(), 'admin'::permission_level))
WITH CHECK (has_permission_level(auth.uid(), 'admin'::permission_level));

-- ────────────────────────────────────────────────────────────
-- TASK_COLLABORATOR_ASSIGNMENTS:
-- Users add themselves only (no self-promotion to admin);
-- team admins manage their team.
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.task_collaborator_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_assignment_select"
ON public.task_collaborator_assignments FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "self_join_no_admin"
ON public.task_collaborator_assignments FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND team_admin = false
);

CREATE POLICY "team_admin_manage_assignments"
ON public.task_collaborator_assignments FOR ALL TO authenticated
USING  (public.is_team_admin(auth.uid(), team_id))
WITH CHECK (public.is_team_admin(auth.uid(), team_id));

-- ────────────────────────────────────────────────────────────
-- SECURITY DEFINER views → security_invoker
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE v text;
BEGIN
  FOREACH v IN ARRAY ARRAY[
    'cm_activity_with_event',
    'user_profiles_teammate_view',
    'team_admins',
    'create_event_safe',
    'unified_tasks',
    'unified_resources',
    'unified_audit_events'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_views
      WHERE schemaname = 'public' AND viewname = v
    ) THEN
      EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', v);
    END IF;
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────
-- Reload PostgREST schema cache
-- ────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

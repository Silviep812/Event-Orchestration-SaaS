-- ============================================================
-- Security hardening — aligned to client Business Guidelines
-- Permission groups: Admin (CRUD all), Organizer/Partner (CRU own),
-- Collaborator (RU assigned), Viewer (R assigned).
-- Removes every public/anon SELECT; scopes all access to auth.uid().
-- Safe to re-run: DROP IF EXISTS before every CREATE POLICY.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Fix has_permission_level:
--    When called without event_id (system-level check), only match
--    rows where event_id IS NULL (true system admins), NOT
--    event-scoped admin roles the user gave themselves.
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
        -- System-level check: _event_id not supplied → only match system roles (event_id IS NULL)
        (_event_id IS NULL AND event_id IS NULL)
        OR
        -- Event-level check: match that specific event or system-wide roles
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
        (_event_id IS NULL AND event_id IS NULL)
        OR (_event_id IS NOT NULL AND (event_id = _event_id OR event_id IS NULL))
      )
      AND (
        permission_level = _level
        OR (_level = 'viewer'      AND permission_level IN ('coordinator', 'admin'))
        OR (_level = 'coordinator' AND permission_level = 'admin')
      )
  )
$$;

-- ────────────────────────────────────────────────────────────
-- 2. events table
--    Remove ALL overly broad SELECT policies; keep owner-scoped ones.
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Drop any public / unconditional policies
DROP POLICY IF EXISTS "Enable read access for all users"          ON public.events;
DROP POLICY IF EXISTS "events_authenticated_read"                  ON public.events;
DROP POLICY IF EXISTS "Collaborators can Read and Update"          ON public.events;
DROP POLICY IF EXISTS "Viewer Read Only"                           ON public.events;
DROP POLICY IF EXISTS "Admins can view all events"                 ON public.events;
DROP POLICY IF EXISTS "Admins can delete events"                   ON public.events;
-- Also drop any leftover from older migrations
DROP POLICY IF EXISTS "Users can view their own events"            ON public.events;
DROP POLICY IF EXISTS "Users can create their own events"          ON public.events;
DROP POLICY IF EXISTS "Users can update their own events"          ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events"          ON public.events;

-- Owner: full CRUD
CREATE POLICY "Owner can view their events"
ON public.events FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Owner can create events"
ON public.events FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can update their events"
ON public.events FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can delete their events"
ON public.events FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Collaborators / Viewers: read-only on events they are assigned to
CREATE POLICY "Collaborators and viewers can read assigned events"
ON public.events FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id  = auth.uid()
      AND ur.event_id = events.id
  )
);

-- System admins: read all events (event_id IS NULL = system-level role)
CREATE POLICY "System admins can view all events"
ON public.events FOR SELECT TO authenticated
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

CREATE POLICY "System admins can delete events"
ON public.events FOR DELETE TO authenticated
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

-- ────────────────────────────────────────────────────────────
-- 3. "User Profile" table
--    Remove public SELECT; users can only see / edit their own row.
-- ────────────────────────────────────────────────────────────
ALTER TABLE public."User Profile" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users"          ON public."User Profile";
DROP POLICY IF EXISTS "Users can view team members user profile data" ON public."User Profile";
DROP POLICY IF EXISTS "Users can view their own profile"          ON public."User Profile";
DROP POLICY IF EXISTS "Users can update their own profile"        ON public."User Profile";
DROP POLICY IF EXISTS "Admins can view all profiles"              ON public."User Profile";

CREATE POLICY "Users can view their own profile"
ON public."User Profile" FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public."User Profile" FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System admins can view all profiles"
ON public."User Profile" FOR SELECT TO authenticated
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

-- ────────────────────────────────────────────────────────────
-- 4. tasks table
--    Owner of the event: CRUD.
--    Collaborators (assigned_to): R + U.
--    Viewers: R only.
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users"          ON public.tasks;
DROP POLICY IF EXISTS "Collaborators can view tasks"              ON public.tasks;
DROP POLICY IF EXISTS "Collaborators can update tasks"            ON public.tasks;
DROP POLICY IF EXISTS "Viewer Read Only tasks"                    ON public.tasks;
DROP POLICY IF EXISTS "Event owners can manage tasks"             ON public.tasks;
DROP POLICY IF EXISTS "Task owner full access"                    ON public.tasks;

-- Event owner: full CRUD on their tasks
CREATE POLICY "Event owners can manage tasks"
ON public.tasks FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = tasks.event_id AND e.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = tasks.event_id AND e.user_id = auth.uid()
  )
);

-- Task creator: full CRUD on tasks they created
CREATE POLICY "Task creators can manage their tasks"
ON public.tasks FOR ALL TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Collaborators: read + update on tasks assigned to them
CREATE POLICY "Collaborators can read assigned tasks"
ON public.tasks FOR SELECT TO authenticated
USING (
  assigned_to = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id  = auth.uid()
      AND ur.event_id = tasks.event_id
  )
);

CREATE POLICY "Collaborators can update assigned tasks"
ON public.tasks FOR UPDATE TO authenticated
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 5. task_collaborator_assignments / team_assignments
--    Users may only add THEMSELVES; team admins may manage their team.
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.task_collaborator_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their team assignments"          ON public.task_collaborator_assignments;
DROP POLICY IF EXISTS "Users can insert their own team assignments"    ON public.task_collaborator_assignments;
DROP POLICY IF EXISTS "Team admins can manage team assignments"        ON public.task_collaborator_assignments;
DROP POLICY IF EXISTS "Enable read access for all users"               ON public.task_collaborator_assignments;
DROP POLICY IF EXISTS tca_insert_secure                                ON public.task_collaborator_assignments;

CREATE POLICY "Users can view their own assignments"
ON public.task_collaborator_assignments FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Users can only add THEMSELVES and cannot self-promote to team_admin
CREATE POLICY "Users can join a team as themselves (no self-promotion)"
ON public.task_collaborator_assignments FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND team_admin = false
);

-- Team admins can manage anyone in their team
CREATE POLICY "Team admins can manage team assignments"
ON public.task_collaborator_assignments FOR ALL TO authenticated
USING  (public.is_team_admin(auth.uid(), team_id))
WITH CHECK (public.is_team_admin(auth.uid(), team_id));

-- ────────────────────────────────────────────────────────────
-- 6. budget_items
--    Owner of the event: CRUD. Collaborators: R only.
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.budget_items;
DROP POLICY IF EXISTS "Admins can view all budget items" ON public.budget_items;
DROP POLICY IF EXISTS "Admins can delete budget items"   ON public.budget_items;
DROP POLICY IF EXISTS "Event owners can manage budget"   ON public.budget_items;

CREATE POLICY "Event owners can manage budget items"
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

CREATE POLICY "Collaborators can read budget items for assigned events"
ON public.budget_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id  = auth.uid()
      AND ur.event_id = budget_items.event_id
  )
);

CREATE POLICY "System admins can manage all budget items"
ON public.budget_items FOR ALL TO authenticated
USING  (has_permission_level(auth.uid(), 'admin'::permission_level))
WITH CHECK (has_permission_level(auth.uid(), 'admin'::permission_level));

-- ────────────────────────────────────────────────────────────
-- 7. Security DEFINER views → security_invoker where possible
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- cm_activity_with_event
  IF EXISTS (
    SELECT 1 FROM pg_views
    WHERE schemaname = 'public' AND viewname = 'cm_activity_with_event'
  ) THEN
    EXECUTE 'ALTER VIEW public.cm_activity_with_event SET (security_invoker = true)';
  END IF;

  -- user_profiles_teammate_view (already set in 20260326 migration; safe to re-apply)
  IF EXISTS (
    SELECT 1 FROM pg_views
    WHERE schemaname = 'public' AND viewname = 'user_profiles_teammate_view'
  ) THEN
    EXECUTE 'ALTER VIEW public.user_profiles_teammate_view SET (security_invoker = true)';
  END IF;

  -- team_admins
  IF EXISTS (
    SELECT 1 FROM pg_views
    WHERE schemaname = 'public' AND viewname = 'team_admins'
  ) THEN
    EXECUTE 'ALTER VIEW public.team_admins SET (security_invoker = true)';
  END IF;

  -- create_event_safe
  IF EXISTS (
    SELECT 1 FROM pg_views
    WHERE schemaname = 'public' AND viewname = 'create_event_safe'
  ) THEN
    EXECUTE 'ALTER VIEW public.create_event_safe SET (security_invoker = true)';
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 8. Notify PostgREST to pick up all policy changes
-- ────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

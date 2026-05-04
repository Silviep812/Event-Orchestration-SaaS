-- Update "Create Event" policies to use permission levels
-- Keep existing user-scoped policies but add permission-based ones
--
-- Use dedicated helpers: remotes that already applied 20251008012430 have both
-- has_permission_level(uuid, permission_level) and (uuid, permission_level, uuid DEFAULT NULL),
-- so a two-argument call to public.has_permission_level is ambiguous (42725).

CREATE OR REPLACE FUNCTION public.policy_has_permission_level(_user_id uuid, _level public.permission_level)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permission_groups rpg ON ur.role = rpg.role
    WHERE ur.user_id = _user_id
      AND rpg.permission_group = _level
  )
$$;

CREATE OR REPLACE FUNCTION public.policy_has_min_permission_level(_user_id uuid, _level public.permission_level)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permission_groups rpg ON ur.role = rpg.role
    WHERE ur.user_id = _user_id
      AND (
        rpg.permission_group = _level OR
        (_level = 'viewer' AND rpg.permission_group IN ('coordinator', 'admin')) OR
        (_level = 'coordinator' AND rpg.permission_group = 'admin')
      )
  )
$$;

-- Admins can view all events
DROP POLICY IF EXISTS "Admins can view all events" ON "Create Event";
CREATE POLICY "Admins can view all events"
ON "Create Event"
FOR SELECT
TO authenticated
USING (public.policy_has_permission_level(auth.uid(), 'admin'::public.permission_level));

-- Coordinators can update any event
DROP POLICY IF EXISTS "Coordinators can update events" ON "Create Event";
CREATE POLICY "Coordinators can update events"
ON "Create Event"
FOR UPDATE
TO authenticated
USING (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level))
WITH CHECK (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level));

-- Admins can delete any event
DROP POLICY IF EXISTS "Admins can delete events" ON "Create Event";
CREATE POLICY "Admins can delete events"
ON "Create Event"
FOR DELETE
TO authenticated
USING (public.policy_has_permission_level(auth.uid(), 'admin'::public.permission_level));

-- Update "Manage Event" policies
DROP POLICY IF EXISTS "Admins can view all managed events" ON "Manage Event";
CREATE POLICY "Admins can view all managed events"
ON "Manage Event"
FOR SELECT
TO authenticated
USING (public.policy_has_permission_level(auth.uid(), 'admin'::public.permission_level));

DROP POLICY IF EXISTS "Coordinators can update managed events" ON "Manage Event";
CREATE POLICY "Coordinators can update managed events"
ON "Manage Event"
FOR UPDATE
TO authenticated
USING (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level))
WITH CHECK (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level));

DROP POLICY IF EXISTS "Admins can delete managed events" ON "Manage Event";
CREATE POLICY "Admins can delete managed events"
ON "Manage Event"
FOR DELETE
TO authenticated
USING (public.policy_has_permission_level(auth.uid(), 'admin'::public.permission_level));

-- Update budget_items policies
DROP POLICY IF EXISTS "Admins can view all budget items" ON budget_items;
CREATE POLICY "Admins can view all budget items"
ON budget_items
FOR SELECT
TO authenticated
USING (public.policy_has_permission_level(auth.uid(), 'admin'::public.permission_level));

DROP POLICY IF EXISTS "Coordinators can manage budget items" ON budget_items;
CREATE POLICY "Coordinators can manage budget items"
ON budget_items
FOR UPDATE
TO authenticated
USING (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level))
WITH CHECK (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level));

DROP POLICY IF EXISTS "Coordinators can create budget items" ON budget_items;
CREATE POLICY "Coordinators can create budget items"
ON budget_items
FOR INSERT
TO authenticated
WITH CHECK (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level));

DROP POLICY IF EXISTS "Admins can delete budget items" ON budget_items;
CREATE POLICY "Admins can delete budget items"
ON budget_items
FOR DELETE
TO authenticated
USING (public.policy_has_permission_level(auth.uid(), 'admin'::public.permission_level));

-- Update tasks policies (assuming a tasks table exists)
-- Coordinators and admins can manage all tasks
DROP POLICY IF EXISTS "Coordinators can view all tasks" ON tasks;
CREATE POLICY "Coordinators can view all tasks"
ON tasks
FOR SELECT
TO authenticated
USING (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level));

DROP POLICY IF EXISTS "Coordinators can update tasks" ON tasks;
CREATE POLICY "Coordinators can update tasks"
ON tasks
FOR UPDATE
TO authenticated
USING (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level))
WITH CHECK (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level));

DROP POLICY IF EXISTS "Coordinators can create tasks" ON tasks;
CREATE POLICY "Coordinators can create tasks"
ON tasks
FOR INSERT
TO authenticated
WITH CHECK (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level));

DROP POLICY IF EXISTS "Coordinators can delete tasks" ON tasks;
CREATE POLICY "Coordinators can delete tasks"
ON tasks
FOR DELETE
TO authenticated
USING (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level));

-- Update Comments policies to allow coordinators to moderate
DROP POLICY IF EXISTS "Coordinators can delete comments" ON "Comments";
CREATE POLICY "Coordinators can delete comments"
ON "Comments"
FOR DELETE
TO authenticated
USING (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level));

DROP POLICY IF EXISTS "Coordinators can update comments" ON "Comments";
CREATE POLICY "Coordinators can update comments"
ON "Comments"
FOR UPDATE
TO authenticated
USING (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level))
WITH CHECK (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level));

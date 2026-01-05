-- Update "Create Event" policies to use permission levels
-- Keep existing user-scoped policies but add permission-based ones

-- Admins can view all events
CREATE POLICY "Admins can view all events"
ON "Create Event"
FOR SELECT
TO authenticated
USING (has_permission_level(auth.uid(), 'admin'));

-- Coordinators can update any event
CREATE POLICY "Coordinators can update events"
ON "Create Event"
FOR UPDATE
TO authenticated
USING (has_min_permission_level(auth.uid(), 'coordinator'))
WITH CHECK (has_min_permission_level(auth.uid(), 'coordinator'));

-- Admins can delete any event
CREATE POLICY "Admins can delete events"
ON "Create Event"
FOR DELETE
TO authenticated
USING (has_permission_level(auth.uid(), 'admin'));

-- Update "Manage Event" policies
CREATE POLICY "Admins can view all managed events"
ON "Manage Event"
FOR SELECT
TO authenticated
USING (has_permission_level(auth.uid(), 'admin'));

CREATE POLICY "Coordinators can update managed events"
ON "Manage Event"
FOR UPDATE
TO authenticated
USING (has_min_permission_level(auth.uid(), 'coordinator'))
WITH CHECK (has_min_permission_level(auth.uid(), 'coordinator'));

CREATE POLICY "Admins can delete managed events"
ON "Manage Event"
FOR DELETE
TO authenticated
USING (has_permission_level(auth.uid(), 'admin'));

-- Update budget_items policies
CREATE POLICY "Admins can view all budget items"
ON budget_items
FOR SELECT
TO authenticated
USING (has_permission_level(auth.uid(), 'admin'));

CREATE POLICY "Coordinators can manage budget items"
ON budget_items
FOR UPDATE
TO authenticated
USING (has_min_permission_level(auth.uid(), 'coordinator'))
WITH CHECK (has_min_permission_level(auth.uid(), 'coordinator'));

CREATE POLICY "Coordinators can create budget items"
ON budget_items
FOR INSERT
TO authenticated
WITH CHECK (has_min_permission_level(auth.uid(), 'coordinator'));

CREATE POLICY "Admins can delete budget items"
ON budget_items
FOR DELETE
TO authenticated
USING (has_permission_level(auth.uid(), 'admin'));

-- Update tasks policies (assuming a tasks table exists)
-- Coordinators and admins can manage all tasks
CREATE POLICY "Coordinators can view all tasks"
ON tasks
FOR SELECT
TO authenticated
USING (has_min_permission_level(auth.uid(), 'coordinator'));

CREATE POLICY "Coordinators can update tasks"
ON tasks
FOR UPDATE
TO authenticated
USING (has_min_permission_level(auth.uid(), 'coordinator'))
WITH CHECK (has_min_permission_level(auth.uid(), 'coordinator'));

CREATE POLICY "Coordinators can create tasks"
ON tasks
FOR INSERT
TO authenticated
WITH CHECK (has_min_permission_level(auth.uid(), 'coordinator'));

CREATE POLICY "Coordinators can delete tasks"
ON tasks
FOR DELETE
TO authenticated
USING (has_min_permission_level(auth.uid(), 'coordinator'));

-- Update Comments policies to allow coordinators to moderate
CREATE POLICY "Coordinators can delete comments"
ON "Comments"
FOR DELETE
TO authenticated
USING (has_min_permission_level(auth.uid(), 'coordinator'));

CREATE POLICY "Coordinators can update comments"
ON "Comments"
FOR UPDATE
TO authenticated
USING (has_min_permission_level(auth.uid(), 'coordinator'))
WITH CHECK (has_min_permission_level(auth.uid(), 'coordinator'));
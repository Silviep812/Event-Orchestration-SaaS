-- Add permission-based RLS policies for Manage Event table
-- Requirements: Admin (CRUD), Coordinators (RU), Viewer (Read only)

-- Drop existing user-scoped policies if they conflict (keep them for backward compatibility)
-- We'll add permission-based policies that work alongside user-scoped ones

-- SELECT: Admin, Coordinator, and Viewer can view manage events
CREATE POLICY "Permission-based view manage events"
ON "Manage Event"
FOR SELECT
TO authenticated
USING (
  has_permission_level(auth.uid(), 'admin'::permission_level) OR
  has_min_permission_level(auth.uid(), 'coordinator'::permission_level) OR
  has_permission_level(auth.uid(), 'viewer'::permission_level)
);

-- UPDATE: Only Admin and Coordinator can update (RU = Read/Update)
CREATE POLICY "Admin and Coordinator can update manage events"
ON "Manage Event"
FOR UPDATE
TO authenticated
USING (has_min_permission_level(auth.uid(), 'coordinator'::permission_level))
WITH CHECK (has_min_permission_level(auth.uid(), 'coordinator'::permission_level));

-- INSERT: Only Admin can create (CRUD = Create/Read/Update/Delete)
CREATE POLICY "Admin can create manage events"
ON "Manage Event"
FOR INSERT
TO authenticated
WITH CHECK (has_permission_level(auth.uid(), 'admin'::permission_level));

-- DELETE: Only Admin can delete (CRUD = Create/Read/Update/Delete)
CREATE POLICY "Admin can delete manage events"
ON "Manage Event"
FOR DELETE
TO authenticated
USING (has_permission_level(auth.uid(), 'admin'::permission_level));











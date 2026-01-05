-- Add policies for role assignment functionality
-- Allow coordinators and admins to insert new roles
CREATE POLICY "coordinators_can_insert_roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_min_permission_level(auth.uid(), 'coordinator'::permission_level));

-- Allow coordinators and admins to update existing roles
CREATE POLICY "coordinators_can_update_roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_min_permission_level(auth.uid(), 'coordinator'::permission_level))
WITH CHECK (has_min_permission_level(auth.uid(), 'coordinator'::permission_level));

-- Allow coordinators and admins to delete roles
CREATE POLICY "coordinators_can_delete_roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_min_permission_level(auth.uid(), 'coordinator'::permission_level));
-- Create RLS policies for user_roles table

-- Policy: Admins can view all role assignments
CREATE POLICY "Admins can view all role assignments"
ON public.user_roles
FOR SELECT
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

-- Policy: Admins can insert role assignments
CREATE POLICY "Admins can insert role assignments"
ON public.user_roles
FOR INSERT
WITH CHECK (has_permission_level(auth.uid(), 'admin'::permission_level));

-- Policy: Admins can update role assignments
CREATE POLICY "Admins can update role assignments"
ON public.user_roles
FOR UPDATE
USING (has_permission_level(auth.uid(), 'admin'::permission_level))
WITH CHECK (has_permission_level(auth.uid(), 'admin'::permission_level));

-- Policy: Admins can delete role assignments
CREATE POLICY "Admins can delete role assignments"
ON public.user_roles
FOR DELETE
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

-- Policy: Users can view their own role assignments
CREATE POLICY "Users can view their own role assignments"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());
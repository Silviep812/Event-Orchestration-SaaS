-- Allow users to view all user roles for team collaboration
CREATE POLICY "Users can view all user roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (true);
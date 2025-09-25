-- Create policies for user_roles table to allow role management
-- Users can insert roles for team members they invite
CREATE POLICY "Users can create roles for their team" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update roles for their team members
CREATE POLICY "Users can update roles for their team" 
ON public.user_roles 
FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can delete roles for their team members
CREATE POLICY "Users can delete roles for their team" 
ON public.user_roles 
FOR DELETE 
USING (auth.uid() IS NOT NULL);
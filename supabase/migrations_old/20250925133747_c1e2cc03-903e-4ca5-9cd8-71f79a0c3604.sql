-- Update policies to use new role names (mapping old roles to new ones)
-- admin -> host, event_manager -> organizer, others -> event_planner

-- Update user_roles table policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Hosts can manage all roles" 
ON public.user_roles 
FOR ALL 
TO authenticated 
USING (has_role(auth.uid(), 'host')) 
WITH CHECK (has_role(auth.uid(), 'host'));

DROP POLICY IF EXISTS "Hosts can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Hosts can manage user roles" ON public.user_roles;
CREATE POLICY "Hosts can view all user roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'host'));

-- Update tasks table policies  
DROP POLICY IF EXISTS "Users can view tasks assigned to them or created by them" ON public.tasks;
CREATE POLICY "Users can view tasks assigned to them or created by them" 
ON public.tasks 
FOR SELECT 
TO authenticated 
USING (assigned_to = auth.uid() OR created_by = auth.uid() OR has_role(auth.uid(), 'host') OR has_role(auth.uid(), 'organizer'));

DROP POLICY IF EXISTS "Event managers and admins can create tasks" ON public.tasks;
CREATE POLICY "Organizers and hosts can create tasks" 
ON public.tasks 
FOR INSERT 
TO authenticated 
WITH CHECK (has_role(auth.uid(), 'host') OR has_role(auth.uid(), 'organizer'));

DROP POLICY IF EXISTS "Users can update tasks assigned to them" ON public.tasks;
CREATE POLICY "Users can update tasks assigned to them" 
ON public.tasks 
FOR UPDATE 
TO authenticated 
USING (assigned_to = auth.uid() OR has_role(auth.uid(), 'host') OR has_role(auth.uid(), 'organizer'));

-- Update change_logs table policies
DROP POLICY IF EXISTS "Users can view change logs for their data" ON public.change_logs;
CREATE POLICY "Users can view change logs for their data" 
ON public.change_logs 
FOR SELECT 
TO authenticated 
USING (changed_by = auth.uid() OR has_role(auth.uid(), 'host'));
-- Continue updating policies for Comments and other tables

-- Update Comments table policies
DROP POLICY IF EXISTS "Admins and event managers can update comments" ON public."Comments";
CREATE POLICY "Hosts and organizers can update comments" 
ON public."Comments" 
FOR UPDATE 
TO authenticated 
USING (has_role(auth.uid(), 'host') OR has_role(auth.uid(), 'organizer'));

DROP POLICY IF EXISTS "Admins and event managers can delete comments" ON public."Comments";
CREATE POLICY "Hosts and organizers can delete comments" 
ON public."Comments" 
FOR DELETE 
TO authenticated 
USING (has_role(auth.uid(), 'host') OR has_role(auth.uid(), 'organizer'));

-- Update Event Analytics table policies
DROP POLICY IF EXISTS "Coordinators can view event analytics" ON public."Event Analytics";
CREATE POLICY "Event planners can view event analytics" 
ON public."Event Analytics" 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'host') OR has_role(auth.uid(), 'organizer') OR has_role(auth.uid(), 'event_planner'));

DROP POLICY IF EXISTS "Managers can insert event analytics" ON public."Event Analytics";
CREATE POLICY "Organizers can insert event analytics" 
ON public."Event Analytics" 
FOR INSERT 
TO authenticated 
WITH CHECK (has_role(auth.uid(), 'host') OR has_role(auth.uid(), 'organizer'));

DROP POLICY IF EXISTS "Managers can update event analytics" ON public."Event Analytics";
CREATE POLICY "Organizers can update event analytics" 
ON public."Event Analytics" 
FOR UPDATE 
TO authenticated 
USING (has_role(auth.uid(), 'host') OR has_role(auth.uid(), 'organizer'));

DROP POLICY IF EXISTS "Admins can delete event analytics" ON public."Event Analytics";
CREATE POLICY "Hosts can delete event analytics" 
ON public."Event Analytics" 
FOR DELETE 
TO authenticated 
USING (has_role(auth.uid(), 'host'));
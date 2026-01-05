-- Update remaining policies in batches

-- Event Plan Report table policies
DROP POLICY IF EXISTS "Coordinators can view event detail report" ON public."Event Plan Report";
DROP POLICY IF EXISTS "Managers can insert event detail report" ON public."Event Plan Report";
DROP POLICY IF EXISTS "Managers can update event detail report" ON public."Event Plan Report";
DROP POLICY IF EXISTS "Admins can delete event detail report" ON public."Event Plan Report";

CREATE POLICY "Event planners can view event detail report" ON public."Event Plan Report" FOR SELECT TO authenticated USING (has_role(auth.uid(), 'host') OR has_role(auth.uid(), 'organizer') OR has_role(auth.uid(), 'event_planner'));
CREATE POLICY "Organizers can insert event detail report" ON public."Event Plan Report" FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'host') OR has_role(auth.uid(), 'organizer'));
CREATE POLICY "Organizers can update event detail report" ON public."Event Plan Report" FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'host') OR has_role(auth.uid(), 'organizer'));
CREATE POLICY "Hosts can delete event detail report" ON public."Event Plan Report" FOR DELETE TO authenticated USING (has_role(auth.uid(), 'host'));

-- Event Resources table policies
DROP POLICY IF EXISTS "Coordinators can view event resources" ON public."Event Resources";
DROP POLICY IF EXISTS "Managers can insert event resources" ON public."Event Resources";
DROP POLICY IF EXISTS "Managers can update event resources" ON public."Event Resources";
DROP POLICY IF EXISTS "Admins can delete event resources" ON public."Event Resources";

CREATE POLICY "Event planners can view event resources" ON public."Event Resources" FOR SELECT TO authenticated USING (has_role(auth.uid(), 'host') OR has_role(auth.uid(), 'organizer') OR has_role(auth.uid(), 'event_planner'));
CREATE POLICY "Organizers can insert event resources" ON public."Event Resources" FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'host') OR has_role(auth.uid(), 'organizer'));
CREATE POLICY "Organizers can update event resources" ON public."Event Resources" FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'host') OR has_role(auth.uid(), 'organizer'));
CREATE POLICY "Hosts can delete event resources" ON public."Event Resources" FOR DELETE TO authenticated USING (has_role(auth.uid(), 'host'));

-- Manage Event Tasks table policies
DROP POLICY IF EXISTS "Coordinators can view manage event tasks" ON public."Manage Event Tasks";
DROP POLICY IF EXISTS "Coordinators can insert manage event tasks" ON public."Manage Event Tasks";
DROP POLICY IF EXISTS "Coordinators can update manage event tasks" ON public."Manage Event Tasks";
DROP POLICY IF EXISTS "Admins and managers can delete manage event tasks" ON public."Manage Event Tasks";

CREATE POLICY "Event planners can view manage event tasks" ON public."Manage Event Tasks" FOR SELECT TO authenticated USING (has_role(auth.uid(), 'host') OR has_role(auth.uid(), 'organizer') OR has_role(auth.uid(), 'event_planner'));
CREATE POLICY "Event planners can insert manage event tasks" ON public."Manage Event Tasks" FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'host') OR has_role(auth.uid(), 'organizer') OR has_role(auth.uid(), 'event_planner'));
CREATE POLICY "Event planners can update manage event tasks" ON public."Manage Event Tasks" FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'host') OR has_role(auth.uid(), 'organizer') OR has_role(auth.uid(), 'event_planner'));
CREATE POLICY "Hosts and organizers can delete manage event tasks" ON public."Manage Event Tasks" FOR DELETE TO authenticated USING (has_role(auth.uid(), 'host') OR has_role(auth.uid(), 'organizer'));
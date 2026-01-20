-- Security Hardening Migration (Essential Parts)

-- PART 1: Convert Security Definer Views to Security Invoker
ALTER VIEW IF EXISTS public.event_kpi_view SET (security_invoker = on);
ALTER VIEW IF EXISTS public.event_task_timeline_view SET (security_invoker = on);
ALTER VIEW IF EXISTS public.unified_audit_events SET (security_invoker = on);
ALTER VIEW IF EXISTS public.unified_locations SET (security_invoker = on);
ALTER VIEW IF EXISTS public.unified_resources SET (security_invoker = on);

-- PART 2: Add basic RLS policies for tables with RLS enabled but no policies
DROP POLICY IF EXISTS "Authenticated users can view event analytics" ON public."Event Analytics";
CREATE POLICY "Authenticated users can view event analytics"
ON public."Event Analytics" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view event resources" ON public."Event Resources";
CREATE POLICY "Authenticated users can view event resources"
ON public."Event Resources" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view manage event tasks" ON public."Manage Event Tasks";
CREATE POLICY "Authenticated users can view manage event tasks"
ON public."Manage Event Tasks" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view task assignments" ON public.tasks_assignments;
CREATE POLICY "Users can view task assignments"
ON public.tasks_assignments FOR SELECT TO authenticated
USING (assigned_to = auth.uid() OR created_by = auth.uid());

DROP POLICY IF EXISTS "Users can manage task assignments" ON public.tasks_assignments;
CREATE POLICY "Users can manage task assignments"
ON public.tasks_assignments FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

-- PART 3: Harden function search path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public'
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PART 4: Grant execute on new functions
GRANT EXECUTE ON FUNCTION public.update_resource_utilization(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_downstream_tasks(UUID, TIMESTAMP WITH TIME ZONE) TO authenticated;
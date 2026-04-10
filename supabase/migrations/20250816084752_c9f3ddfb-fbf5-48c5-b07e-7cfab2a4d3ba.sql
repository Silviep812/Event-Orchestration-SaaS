-- Enable RLS and add secure policies for sensitive tables.
-- Remote projects may not contain every legacy quoted relation from early Lovable exports,
-- so guard each block and skip missing objects instead of failing `supabase db push`.

DO $$
BEGIN
  -- 1) Comments
  IF to_regclass('public."Comments"') IS NOT NULL THEN
    ALTER TABLE public."Comments" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Authenticated users can view comments" ON public."Comments";
    DROP POLICY IF EXISTS "Authenticated users can create comments" ON public."Comments";
    DROP POLICY IF EXISTS "Admins and event managers can update comments" ON public."Comments";
    DROP POLICY IF EXISTS "Admins and event managers can delete comments" ON public."Comments";

    CREATE POLICY "Authenticated users can view comments"
    ON public."Comments"
    FOR SELECT
    TO authenticated
    USING (true);

    CREATE POLICY "Authenticated users can create comments"
    ON public."Comments"
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

    CREATE POLICY "Admins and event managers can update comments"
    ON public."Comments"
    FOR UPDATE
    TO authenticated
    USING (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'event_manager'::app_role)
    );

    CREATE POLICY "Admins and event managers can delete comments"
    ON public."Comments"
    FOR DELETE
    TO authenticated
    USING (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'event_manager'::app_role)
    );
  END IF;

  -- 2) Event Analytics
  IF to_regclass('public."Event Analytics"') IS NOT NULL THEN
    ALTER TABLE public."Event Analytics" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Coordinators can view event analytics" ON public."Event Analytics";
    DROP POLICY IF EXISTS "Managers can insert event analytics" ON public."Event Analytics";
    DROP POLICY IF EXISTS "Managers can update event analytics" ON public."Event Analytics";
    DROP POLICY IF EXISTS "Admins can delete event analytics" ON public."Event Analytics";

    CREATE POLICY "Coordinators can view event analytics"
    ON public."Event Analytics"
    FOR SELECT
    TO authenticated
    USING (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'event_manager'::app_role)
      OR public.has_role(auth.uid(), 'task_coordinator'::app_role)
    );

    CREATE POLICY "Managers can insert event analytics"
    ON public."Event Analytics"
    FOR INSERT
    TO authenticated
    WITH CHECK (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'event_manager'::app_role)
    );

    CREATE POLICY "Managers can update event analytics"
    ON public."Event Analytics"
    FOR UPDATE
    TO authenticated
    USING (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'event_manager'::app_role)
    );

    CREATE POLICY "Admins can delete event analytics"
    ON public."Event Analytics"
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;

  -- 3) Event Detail Report
  IF to_regclass('public."Event Detail Report"') IS NOT NULL THEN
    ALTER TABLE public."Event Detail Report" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Coordinators can view event detail report" ON public."Event Detail Report";
    DROP POLICY IF EXISTS "Managers can insert event detail report" ON public."Event Detail Report";
    DROP POLICY IF EXISTS "Managers can update event detail report" ON public."Event Detail Report";
    DROP POLICY IF EXISTS "Admins can delete event detail report" ON public."Event Detail Report";

    CREATE POLICY "Coordinators can view event detail report"
    ON public."Event Detail Report"
    FOR SELECT
    TO authenticated
    USING (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'event_manager'::app_role)
      OR public.has_role(auth.uid(), 'task_coordinator'::app_role)
    );

    CREATE POLICY "Managers can insert event detail report"
    ON public."Event Detail Report"
    FOR INSERT
    TO authenticated
    WITH CHECK (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'event_manager'::app_role)
    );

    CREATE POLICY "Managers can update event detail report"
    ON public."Event Detail Report"
    FOR UPDATE
    TO authenticated
    USING (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'event_manager'::app_role)
    );

    CREATE POLICY "Admins can delete event detail report"
    ON public."Event Detail Report"
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;

  -- 4) Event Resources
  IF to_regclass('public."Event Resources"') IS NOT NULL THEN
    ALTER TABLE public."Event Resources" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Coordinators can view event resources" ON public."Event Resources";
    DROP POLICY IF EXISTS "Managers can insert event resources" ON public."Event Resources";
    DROP POLICY IF EXISTS "Managers can update event resources" ON public."Event Resources";
    DROP POLICY IF EXISTS "Admins can delete event resources" ON public."Event Resources";

    CREATE POLICY "Coordinators can view event resources"
    ON public."Event Resources"
    FOR SELECT
    TO authenticated
    USING (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'event_manager'::app_role)
      OR public.has_role(auth.uid(), 'task_coordinator'::app_role)
    );

    CREATE POLICY "Managers can insert event resources"
    ON public."Event Resources"
    FOR INSERT
    TO authenticated
    WITH CHECK (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'event_manager'::app_role)
    );

    CREATE POLICY "Managers can update event resources"
    ON public."Event Resources"
    FOR UPDATE
    TO authenticated
    USING (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'event_manager'::app_role)
    );

    CREATE POLICY "Admins can delete event resources"
    ON public."Event Resources"
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;

  -- 5) Manage Event Tasks
  IF to_regclass('public."Manage Event Tasks"') IS NOT NULL THEN
    ALTER TABLE public."Manage Event Tasks" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Coordinators can view manage event tasks" ON public."Manage Event Tasks";
    DROP POLICY IF EXISTS "Coordinators can insert manage event tasks" ON public."Manage Event Tasks";
    DROP POLICY IF EXISTS "Coordinators can update manage event tasks" ON public."Manage Event Tasks";
    DROP POLICY IF EXISTS "Admins and managers can delete manage event tasks" ON public."Manage Event Tasks";

    CREATE POLICY "Coordinators can view manage event tasks"
    ON public."Manage Event Tasks"
    FOR SELECT
    TO authenticated
    USING (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'event_manager'::app_role)
      OR public.has_role(auth.uid(), 'task_coordinator'::app_role)
    );

    CREATE POLICY "Coordinators can insert manage event tasks"
    ON public."Manage Event Tasks"
    FOR INSERT
    TO authenticated
    WITH CHECK (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'event_manager'::app_role)
      OR public.has_role(auth.uid(), 'task_coordinator'::app_role)
    );

    CREATE POLICY "Coordinators can update manage event tasks"
    ON public."Manage Event Tasks"
    FOR UPDATE
    TO authenticated
    USING (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'event_manager'::app_role)
      OR public.has_role(auth.uid(), 'task_coordinator'::app_role)
    );

    CREATE POLICY "Admins and managers can delete manage event tasks"
    ON public."Manage Event Tasks"
    FOR DELETE
    TO authenticated
    USING (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'event_manager'::app_role)
    );
  END IF;
END $$;

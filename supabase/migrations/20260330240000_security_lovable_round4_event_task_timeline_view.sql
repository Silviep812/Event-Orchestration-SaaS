-- Lovable round 4 (1/4): event_task_timeline_view — invoker so underlying tasks/events RLS applies

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'event_task_timeline_view' AND c.relkind = 'v'
  ) THEN
    EXECUTE 'ALTER VIEW public.event_task_timeline_view SET (security_invoker = true)';
    REVOKE ALL ON public.event_task_timeline_view FROM anon;
    GRANT SELECT ON public.event_task_timeline_view TO authenticated;
  END IF;
END $$;

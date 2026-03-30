-- Lovable round 3 (1/5): event_kpi_view — invoker so underlying events/budget RLS applies

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'event_kpi_view' AND c.relkind = 'v'
  ) THEN
    EXECUTE 'ALTER VIEW public.event_kpi_view SET (security_invoker = true)';
    REVOKE ALL ON public.event_kpi_view FROM anon;
    GRANT SELECT ON public.event_kpi_view TO authenticated;
  END IF;
END $$;

-- Reports / ManageEvent query cm_activity (or security_invoker views over it).
-- authenticated must have SELECT on the table; row access is still enforced by RLS.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'cm_activity'
      AND c.relkind = 'r'
  ) THEN
    GRANT SELECT ON TABLE public.cm_activity TO authenticated;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

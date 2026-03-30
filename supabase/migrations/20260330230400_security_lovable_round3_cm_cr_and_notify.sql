-- Lovable round 3 (5/5): drop permissive Lovable cr_* policies on cm_change_requests; reload PostgREST

DO $$
DECLARE
  r RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cm_change_requests'
  ) THEN
    FOR r IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'cm_change_requests'
        AND policyname ~ '^cr_'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.cm_change_requests', r.policyname);
    END LOOP;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

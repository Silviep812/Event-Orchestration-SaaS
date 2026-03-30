-- Lovable round 2 (5/5): team_admins view RLS + PostgREST reload

DO $$
DECLARE
  rk char;
BEGIN
  SELECT c.relkind INTO rk
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'team_admins';

  IF rk = 'v' THEN
    BEGIN
      EXECUTE 'ALTER VIEW public.team_admins SET (security_invoker = true)';
      EXECUTE 'ALTER VIEW public.team_admins ENABLE ROW LEVEL SECURITY';
      DROP POLICY IF EXISTS team_admins_select_own ON public.team_admins;
      CREATE POLICY team_admins_select_own
      ON public.team_admins
      FOR SELECT TO authenticated
      USING (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.team_assignments ta
          WHERE ta.team_id = team_admins.team_id
            AND ta.user_id = auth.uid()
        )
      );
      REVOKE ALL ON public.team_admins FROM anon;
    EXCEPTION
      WHEN OTHERS THEN
        EXECUTE 'ALTER VIEW public.team_admins SET (security_invoker = true)';
    END;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

-- Lovable scan: "team_admins has no RLS" — when team_admins is a VIEW, policies attach to the
-- view with security_invoker so underlying team_assignments RLS applies. Plain ALTER also in
-- 20260404220000_lovable_code_scan_plain_alter_views.sql for static greps.

DO $$
DECLARE
  rk char;
BEGIN
  SELECT c.relkind INTO rk
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'team_admins';

  IF rk = 'v' THEN
    EXECUTE 'ALTER VIEW public.team_admins SET (security_invoker = true)';
    EXECUTE 'ALTER VIEW public.team_admins SET (security_barrier = true)';
    EXECUTE 'REVOKE ALL ON public.team_admins FROM anon';
    EXECUTE 'GRANT SELECT ON public.team_admins TO authenticated';
    EXECUTE $c$
      COMMENT ON VIEW public.team_admins IS
        'SECURITY INVOKER view; visibility follows team_assignments RLS (policy team_admins_select_own on this view).'
    $c$;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

-- activity_feed is a normal VIEW. PostgreSQL does NOT support ENABLE ROW LEVEL SECURITY or
-- CREATE POLICY on plain views (error 42809). Access control is: security_invoker + security_barrier
-- so the querying user's RLS on public.cm_activity applies (see 20260408120000 member policy).

ALTER VIEW public.activity_feed SET (security_invoker = true);
ALTER VIEW public.activity_feed SET (security_barrier = true);

REVOKE ALL ON public.activity_feed FROM anon;
GRANT SELECT ON public.activity_feed TO authenticated;

COMMENT ON VIEW public.activity_feed IS
  'SECURITY INVOKER view over cm_activity; row visibility follows cm_activity RLS for the session user.';

NOTIFY pgrst, 'reload schema';

-- supabase_lov / Lovable: duplicate permissive UPDATE paths on change_requests can look like
-- multiple "cr_update_own" rows with WITH CHECK (true) when policies OR together.
-- Drop every policy named cr_update_own (any casing) plus the legacy requester policy, then one strict policy.

ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS change_requests_update_by_requester ON public.change_requests;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'change_requests'
      AND lower(policyname) = 'cr_update_own'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.change_requests', r.policyname);
  END LOOP;
END $$;

-- Unquoted + quoted forms (idempotent if loop already dropped)
DROP POLICY IF EXISTS cr_update_own ON public.change_requests;
DROP POLICY IF EXISTS "cr_update_own" ON public.change_requests;

CREATE POLICY cr_update_own ON public.change_requests
  FOR UPDATE TO authenticated
  USING ((requested_by)::text = (auth.uid())::text)
  WITH CHECK ((requested_by)::text = (auth.uid())::text);

NOTIFY pgrst, 'reload schema';

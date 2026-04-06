-- Aligns with Lovable "Try to fix all" / Code security review (plain DDL where possible;
-- see 20260404220000_lovable_code_scan_plain_alter_views.sql).

-- ─── Fix 1: private_profiles — own row insert (table may already exist on hosted DB) ─
CREATE TABLE IF NOT EXISTS public.private_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.private_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS owner_insert_private ON public.private_profiles;

CREATE POLICY owner_insert_private ON public.private_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text);

REVOKE ALL ON public.private_profiles FROM anon;
GRANT INSERT ON public.private_profiles TO authenticated;

-- ─── Fix 2: change_requests — cr_update_own (name + USING/WITH CHECK; uuid/text safe) ─
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cr_update_own ON public.change_requests;

CREATE POLICY cr_update_own ON public.change_requests
  FOR UPDATE TO authenticated
  USING (requested_by::text = auth.uid()::text)
  WITH CHECK (requested_by::text = auth.uid()::text);

-- Same semantics as change_requests_update_by_requester (04170000); keep one policy for scanners + clarity
DROP POLICY IF EXISTS change_requests_update_by_requester ON public.change_requests;

NOTIFY pgrst, 'reload schema';

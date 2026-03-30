-- Lovable / Supabase advisor fixes (team_assignments TO public, permissive INSERT,
-- Venue Profile anon read, helper functions search_path).
-- Run after 20260330120000_security_drop_all_and_rebuild.sql
-- Safe to re-run.

-- ────────────────────────────────────────────────────────────
-- Helpers: empty team membership checks (SECURITY DEFINER, fixed search_path)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.team_assignments_is_empty(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.team_assignments WHERE team_id = p_team_id
  );
$$;

CREATE OR REPLACE FUNCTION public.tca_team_is_empty(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.task_collaborator_assignments WHERE team_id = p_team_id
  );
$$;

REVOKE ALL ON FUNCTION public.team_assignments_is_empty(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.team_assignments_is_empty(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.tca_team_is_empty(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tca_team_is_empty(uuid) TO authenticated;

-- ────────────────────────────────────────────────────────────
-- team_assignments: drop ALL policies (old migrations used TO public)
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'team_assignments'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.team_assignments', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.team_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY ta_select_own_or_admin
ON public.team_assignments FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_team_admin(auth.uid(), team_id)
);

-- First member of a team may insert themselves as admin; otherwise only admins add members
CREATE POLICY ta_insert_bootstrap_or_admin
ON public.team_assignments FOR INSERT TO authenticated
WITH CHECK (
  public.is_team_admin(auth.uid(), team_id)
  OR (
    public.team_assignments_is_empty(team_id)
    AND user_id = auth.uid()
    AND team_admin = true
  )
);

CREATE POLICY ta_update_admin_only
ON public.team_assignments FOR UPDATE TO authenticated
USING (public.is_team_admin(auth.uid(), team_id))
WITH CHECK (public.is_team_admin(auth.uid(), team_id));

CREATE POLICY ta_delete_admin_only
ON public.team_assignments FOR DELETE TO authenticated
USING (public.is_team_admin(auth.uid(), team_id));

-- ────────────────────────────────────────────────────────────
-- task_collaborator_assignments: replace permissive self_join_no_admin
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "self_join_no_admin" ON public.task_collaborator_assignments;
DROP POLICY IF EXISTS tca_insert_bootstrap_or_admin ON public.task_collaborator_assignments;

CREATE POLICY tca_insert_bootstrap_or_admin
ON public.task_collaborator_assignments FOR INSERT TO authenticated
WITH CHECK (
  public.is_team_admin(auth.uid(), team_id)
  OR (
    public.tca_team_is_empty(team_id)
    AND user_id = auth.uid()
    AND team_admin = true
  )
);

-- ────────────────────────────────────────────────────────────
-- "Venue Profile": remove anonymous read (TO public USING true)
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view venue profiles" ON public."Venue Profile";
DROP POLICY IF EXISTS "venue_profile_select_authenticated" ON public."Venue Profile";

CREATE POLICY "venue_profile_select_authenticated"
ON public."Venue Profile" FOR SELECT TO authenticated
USING (true);

-- ────────────────────────────────────────────────────────────
-- Harden is_team_admin / has_permission_level search_path (advisor)
-- ────────────────────────────────────────────────────────────
ALTER FUNCTION public.is_team_admin(uuid, uuid) SET search_path = public;

-- ────────────────────────────────────────────────────────────
-- Realtime: RLS applies; ensure anon has no table GRANT (Supabase default)
-- ────────────────────────────────────────────────────────────
REVOKE ALL ON public.events FROM anon;
REVOKE ALL ON public."User Profile" FROM anon;

NOTIFY pgrst, 'reload schema';

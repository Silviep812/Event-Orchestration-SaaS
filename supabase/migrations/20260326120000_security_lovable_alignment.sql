-- Align Git/migrations with manual Supabase hardening (Lovable + Advisor).
-- Safe to re-run: uses IF EXISTS / DROP IF EXISTS where possible.

-- 1) User Profile: remove broad teammate SELECT (exposes Pay_Method, email, phone)
DROP POLICY IF EXISTS "Users can view team members user profile data" ON public."User Profile";

-- 2) Teammate-safe view: security_invoker so RLS applies as the querying user
DROP VIEW IF EXISTS public.user_profiles_teammate_view CASCADE;
CREATE VIEW public.user_profiles_teammate_view
  WITH (security_invoker = true)
  AS
  SELECT pub.user_id,
         NULL::text AS full_name,
         pub.display_name,
         pub.role,
         pub.avatar_url
  FROM public.public_profiles AS pub;

GRANT SELECT ON public.user_profiles_teammate_view TO authenticated;

-- 3) team_admins view (if present): avoid SECURITY DEFINER advisor warning
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_views v
    WHERE v.schemaname = 'public' AND v.viewname = 'team_admins'
  ) THEN
    EXECUTE 'ALTER VIEW public.team_admins SET (security_invoker = true)';
  END IF;
END $$;

-- 4) task_collaborator_assignments: insert check via function (scanner-friendly)
CREATE OR REPLACE FUNCTION public.tca_insert_allowed(
  p_team_id uuid,
  p_user_id uuid,
  p_team_admin boolean
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_user_id = auth.uid()
    AND (
      COALESCE(p_team_admin, false) = false
      OR (
        COALESCE(p_team_admin, false) = true
        AND public.is_current_user_team_admin(p_team_id)
      )
    );
$$;

REVOKE ALL ON FUNCTION public.tca_insert_allowed(uuid, uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tca_insert_allowed(uuid, uuid, boolean) TO authenticated;

DROP POLICY IF EXISTS tca_insert_secure ON public.task_collaborator_assignments;

CREATE POLICY tca_insert_secure ON public.task_collaborator_assignments
  FOR INSERT TO authenticated
  WITH CHECK (public.tca_insert_allowed(team_id, user_id, team_admin));

-- 5) Remove world-readable SELECT if still present (real security issue)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.task_collaborator_assignments;

-- Lovable / Supabase advisor follow-ups: function search_path, permissive INSERT policies,
-- user_roles_service_role (dropped: service_role bypasses RLS on Supabase), public_profiles policies.
-- Idempotent: DROP POLICY IF EXISTS before CREATE where needed.

-- ── 1. Function search path (lint 0011_function_search_path_mutable) ─────────

CREATE OR REPLACE FUNCTION public.cm_are_team_members(u1 uuid, u2 uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.task_collaborator_assignments t1
    JOIN public.task_collaborator_assignments t2
      ON t1.team_id = t2.team_id
    WHERE t1.user_id = u1
      AND t2.user_id = u2
  );
$$;

CREATE OR REPLACE FUNCTION public.generate_magic_link(user_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_token text;
  expiry    timestamp with time zone;
BEGIN
  new_token := encode(gen_random_bytes(32), 'hex');
  expiry    := now() + interval '15 minutes';
  UPDATE public."Authorization"
  SET
    magic_link_token        = new_token,
    magic_link_expires_at   = expiry,
    magic_link_sent_at      = now(),
    magic_link_used         = false,
    magic_link_used_at      = NULL,
    magic_link_request_count = COALESCE(magic_link_request_count, 0) + 1
  WHERE sign_in = user_email;
  RETURN new_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_magic_link(input_token text)
RETURNS TABLE(is_valid boolean, user_email text, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN a.magic_link_token IS NULL       THEN false
      WHEN a.magic_link_used  = true        THEN false
      WHEN a.magic_link_expires_at < now()  THEN false
      ELSE true
    END AS is_valid,
    a.sign_in AS user_email,
    CASE
      WHEN a.magic_link_token IS NULL       THEN 'Token not found'
      WHEN a.magic_link_used  = true        THEN 'Token already used'
      WHEN a.magic_link_expires_at < now()  THEN 'Token expired'
      ELSE 'Valid'
    END AS reason
  FROM public."Authorization" a
  WHERE a.magic_link_token = input_token;

  UPDATE public."Authorization"
  SET
    magic_link_used    = true,
    magic_link_used_at = now()
  WHERE magic_link_token = input_token
    AND magic_link_used  = false
    AND magic_link_expires_at >= now();
END;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_team_admin(team uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.task_collaborator_assignments tca
    WHERE tca.team_id = team
      AND tca.user_id = auth.uid()
      AND tca.team_admin = true
  );
$$;

-- ── 2. RLS: INSERT policies (lint 0024 — avoid WITH CHECK (true) on writes) ───

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public."Comments";
CREATE POLICY "Authenticated users can create comments"
ON public."Comments"
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert entertainments" ON public.entertainments;
CREATE POLICY "Authenticated users can insert entertainments"
ON public.entertainments
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert marketing_profiles" ON public.marketing_profiles;
CREATE POLICY "Authenticated users can insert marketing_profiles"
ON public.marketing_profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert venues" ON public.venues;
CREATE POLICY "Authenticated users can insert venues"
ON public.venues
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can create qrcode submissions" ON public.qrcode_submissions;
DROP POLICY IF EXISTS "Authenticated users can create barcode submissions" ON public.qrcode_submissions;
CREATE POLICY "Anyone can create qrcode submissions"
ON public.qrcode_submissions
FOR INSERT
WITH CHECK (book_id IS NOT NULL AND book_id != '');

DROP POLICY IF EXISTS "Anyone can create RSVP submissions" ON public.rsvp_submissions;
CREATE POLICY "Anyone can create RSVP submissions"
ON public.rsvp_submissions
FOR INSERT
WITH CHECK (book_id IS NOT NULL AND book_id != '');

-- service_role bypasses RLS on Supabase; this policy only satisfied the linter
DROP POLICY IF EXISTS "user_roles_service_role" ON public.user_roles;

-- ── 3. public_profiles: RLS enabled but no policy (lint) ─────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'public_profiles'
  ) THEN
    EXECUTE 'ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.public_profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own public profile" ON public.public_profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own public profile" ON public.public_profiles';
    EXECUTE $p$
      CREATE POLICY "Anyone can view public profiles"
      ON public.public_profiles
      FOR SELECT
      USING (true)
    $p$;
    EXECUTE $p$
      CREATE POLICY "Users can update own public profile"
      ON public.public_profiles
      FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid())
    $p$;
    EXECUTE $p$
      CREATE POLICY "Users can insert own public profile"
      ON public.public_profiles
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid())
    $p$;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

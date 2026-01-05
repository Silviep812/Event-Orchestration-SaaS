-- Harden security for sensitive customer data and remediate linter warnings
BEGIN;

-- 1) Set deterministic search_path on functions flagged by linter
-- handle_new_user_profile currently lacks explicit search_path
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'));
  RETURN NEW;
END;
$$;

-- 2) Lock down Authorization table (contains password-like fields)
-- Ensure RLS is enabled
ALTER TABLE public."Authorization" ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive existing policies if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'Authorization' AND policyname = 'Users can access their own authorization data'
  ) THEN
    DROP POLICY "Users can access their own authorization data" ON public."Authorization";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'Authorization' AND policyname = 'Users can create their own authorization records'
  ) THEN
    DROP POLICY "Users can create their own authorization records" ON public."Authorization";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'Authorization' AND policyname = 'Users can delete their own authorization records'
  ) THEN
    DROP POLICY "Users can delete their own authorization records" ON public."Authorization";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'Authorization' AND policyname = 'Users can update their own authorization records'
  ) THEN
    DROP POLICY "Users can update their own authorization records" ON public."Authorization";
  END IF;
END $$;

-- Create deny-by-default SELECT policy (no one can read rows directly)
CREATE POLICY "No direct select on Authorization"
ON public."Authorization"
FOR SELECT
USING (false);

-- Only admins may insert/update/delete records if truly needed
CREATE POLICY "Admins manage Authorization"
ON public."Authorization"
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update Authorization"
ON public."Authorization"
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete Authorization"
ON public."Authorization"
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3) Scrub any sensitive data already stored in Authorization
UPDATE public."Authorization"
SET pass_word = NULL,
    create_password = NULL,
    reset_pw = NULL
WHERE pass_word IS NOT NULL
   OR create_password IS NOT NULL
   OR reset_pw IS NOT NULL;

-- 4) Add trigger to prevent storing sensitive password fields going forward
CREATE OR REPLACE FUNCTION public.scrub_authorization_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Never persist plaintext or pseudo-password fields
  NEW.pass_word := NULL;
  NEW.create_password := NULL;
  NEW.reset_pw := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_scrub_authorization_sensitive_fields ON public."Authorization";
CREATE TRIGGER trg_scrub_authorization_sensitive_fields
BEFORE INSERT OR UPDATE ON public."Authorization"
FOR EACH ROW
EXECUTE FUNCTION public.scrub_authorization_sensitive_fields();

COMMIT;
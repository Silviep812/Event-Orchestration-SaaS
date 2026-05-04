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
DROP POLICY IF EXISTS "No direct select on Authorization" ON public."Authorization";
CREATE POLICY "No direct select on Authorization"
ON public."Authorization"
FOR SELECT
USING (false);

-- Only admins may insert/update/delete records if truly needed
DROP POLICY IF EXISTS "Admins manage Authorization" ON public."Authorization";
CREATE POLICY "Admins manage Authorization"
ON public."Authorization"
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update Authorization" ON public."Authorization";
CREATE POLICY "Admins update Authorization"
ON public."Authorization"
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete Authorization" ON public."Authorization";
CREATE POLICY "Admins delete Authorization"
ON public."Authorization"
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3) Scrub any sensitive data already stored in Authorization
-- Columns may have been renamed/dropped on remote; only touch columns that exist.
DO $scrub$
DECLARE
  sets text[] := '{}';
  wheres text[] := '{}';
  col text;
  cols constant text[] := ARRAY['pass_word', 'create_password', 'reset_pw'];
BEGIN
  IF pg_catalog.to_regclass('public."Authorization"') IS NULL THEN
    RETURN;
  END IF;

  FOREACH col IN ARRAY cols
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = 'Authorization'
        AND c.column_name = col
    ) THEN
      sets := array_append(sets, format('%I = NULL', col));
      wheres := array_append(wheres, format('%I IS NOT NULL', col));
    END IF;
  END LOOP;

  IF cardinality(sets) > 0 THEN
    EXECUTE format(
      'UPDATE public."Authorization" SET %s WHERE %s',
      array_to_string(sets, ', '),
      array_to_string(wheres, ' OR ')
    );
  END IF;
END $scrub$;

-- 4) Add trigger to prevent storing sensitive password fields going forward
DO $tr$
DECLARE
  assigns text := '';
  col text;
  cols constant text[] := ARRAY['pass_word', 'create_password', 'reset_pw'];
BEGIN
  IF pg_catalog.to_regclass('public."Authorization"') IS NULL THEN
    RETURN;
  END IF;

  FOREACH col IN ARRAY cols
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = 'Authorization'
        AND c.column_name = col
    ) THEN
      assigns := assigns || format('  NEW.%I := NULL;%s', col, chr(10));
    END IF;
  END LOOP;

  IF assigns = '' THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.scrub_authorization_sensitive_fields()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path TO public
      AS $body$
      BEGIN
        RETURN NEW;
      END
      $body$
    $fn$;
  ELSE
    EXECUTE format($fn$
      CREATE OR REPLACE FUNCTION public.scrub_authorization_sensitive_fields()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path TO public
      AS $body$
      BEGIN
%s        RETURN NEW;
      END
      $body$
    $fn$, assigns);
  END IF;

  EXECUTE 'DROP TRIGGER IF EXISTS trg_scrub_authorization_sensitive_fields ON public."Authorization"';
  EXECUTE $sql$
    CREATE TRIGGER trg_scrub_authorization_sensitive_fields
    BEFORE INSERT OR UPDATE ON public."Authorization"
    FOR EACH ROW
    EXECUTE FUNCTION public.scrub_authorization_sensitive_fields()
  $sql$;
END $tr$;

COMMIT;
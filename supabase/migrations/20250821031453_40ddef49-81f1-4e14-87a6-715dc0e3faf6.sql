-- Restrict public access to public."User" and require authentication + ownership
-- Idempotent: public."User" was dropped in a later migration; skip if absent.

DO $migration$
BEGIN
  IF pg_catalog.to_regclass('public."User"') IS NULL THEN
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY';

  EXECUTE 'DROP POLICY IF EXISTS "Users can create their own profile" ON public."User"';
  EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own profile" ON public."User"';
  EXECUTE 'DROP POLICY IF EXISTS "Users can update their own profile" ON public."User"';
  EXECUTE 'DROP POLICY IF EXISTS "Users can view their own profile" ON public."User"';

  EXECUTE $p$
    CREATE POLICY "Users can create their own profile"
    ON public."User"
    FOR INSERT
    TO authenticated
    WITH CHECK (userid = auth.uid())
  $p$;

  EXECUTE $p$
    CREATE POLICY "Users can update their own profile"
    ON public."User"
    FOR UPDATE
    TO authenticated
    USING (userid = auth.uid())
    WITH CHECK (userid = auth.uid())
  $p$;

  EXECUTE $p$
    CREATE POLICY "Users can delete their own profile"
    ON public."User"
    FOR DELETE
    TO authenticated
    USING (userid = auth.uid())
  $p$;

  EXECUTE $p$
    CREATE POLICY "Users can view their own profile"
    ON public."User"
    FOR SELECT
    TO authenticated
    USING (userid = auth.uid())
  $p$;
END $migration$;

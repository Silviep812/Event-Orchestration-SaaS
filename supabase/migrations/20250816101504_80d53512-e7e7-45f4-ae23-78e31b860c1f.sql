-- Restrict public read access on public."User" and provide a safe admin-only directory.
-- Idempotent: public."User" was dropped in 20251007140737; skip entirely if the table is absent.
-- Uses information_schema + format(%I) so "User" vs user both resolve correctly.

DO $migration$
DECLARE
  tbl text;
BEGIN
  SELECT t.table_name INTO tbl
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_name IN ('User', 'user')
  ORDER BY CASE WHEN t.table_name = 'User' THEN 0 ELSE 1 END
  LIMIT 1;

  IF tbl IS NULL THEN
    RETURN;
  END IF;

  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

  EXECUTE format('DROP POLICY IF EXISTS "Users can view their own profile" ON public.%I', tbl);
  EXECUTE format('DROP POLICY IF EXISTS "Users can update their own profile" ON public.%I', tbl);
  EXECUTE format('DROP POLICY IF EXISTS "Users can delete their own profile" ON public.%I', tbl);
  EXECUTE format('DROP POLICY IF EXISTS "Users can create their own profile" ON public.%I', tbl);

  EXECUTE format($sql$
    CREATE POLICY "Users can view their own profile"
    ON public.%I
    FOR SELECT
    TO authenticated
    USING (userid = auth.uid())
  $sql$, tbl);

  EXECUTE format($sql$
    CREATE POLICY "Users can update their own profile"
    ON public.%I
    FOR UPDATE
    TO authenticated
    USING (userid = auth.uid())
    WITH CHECK (userid = auth.uid())
  $sql$, tbl);

  EXECUTE format($sql$
    CREATE POLICY "Users can delete their own profile"
    ON public.%I
    FOR DELETE
    TO authenticated
    USING (userid = auth.uid())
  $sql$, tbl);

  EXECUTE format($sql$
    CREATE POLICY "Users can create their own profile"
    ON public.%I
    FOR INSERT
    TO authenticated
    WITH CHECK (userid = auth.uid())
  $sql$, tbl);

  EXECUTE format($fn$
    CREATE OR REPLACE FUNCTION public.get_user_directory_safe()
    RETURNS TABLE(userid uuid, user_name text, contact_name text)
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $body$
      SELECT u.userid, u.user_name, u.contact_name
      FROM public.%I u
      WHERE has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'event_manager');
    $body$
  $fn$, tbl);
END $migration$;

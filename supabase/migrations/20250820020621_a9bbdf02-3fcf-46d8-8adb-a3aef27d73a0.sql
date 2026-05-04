-- Fix remaining security linter warnings
-- Idempotent: public."User" may already be dropped (see later migrations); policies may already exist.

-- 1) Fix Function Search Path issues - secure existing functions
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'));
  RETURN NEW;
END;
$$;

-- References public."User" only at runtime when that table exists (avoid CREATE-time validation failures).
CREATE OR REPLACE FUNCTION public.get_user_directory_safe()
RETURNS TABLE(userid uuid, user_name text, contact_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF pg_catalog.to_regclass('public."User"') IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY EXECUTE $q$
    SELECT u.userid, u.user_name, u.contact_name
    FROM public."User" u
    WHERE has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'event_manager')
  $q$;
END;
$$;

-- 2) Add RLS policies for tables that have RLS enabled but no policies
-- ON public."..." must reference an existing relation; skip whole block if table was renamed/dropped.

DO $apply$
BEGIN
  IF pg_catalog.to_regclass('public."Registration"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can access registration" ON public."Registration"';
    EXECUTE $p$
      CREATE POLICY "Authenticated users can access registration"
      ON public."Registration"
      FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated')
    $p$;
  END IF;

  IF pg_catalog.to_regclass('public."Subscription_Plans Directory"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public."Subscription_Plans Directory"';
    EXECUTE $p$
      CREATE POLICY "Anyone can view subscription plans"
      ON public."Subscription_Plans Directory"
      FOR SELECT
      USING (true)
    $p$;

    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage subscription plans" ON public."Subscription_Plans Directory"';
    EXECUTE $p$
      CREATE POLICY "Admins can manage subscription plans"
      ON public."Subscription_Plans Directory"
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'))
    $p$;
  END IF;

  IF pg_catalog.to_regclass('public."Supplier Vendor Profile"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view supplier vendor profiles" ON public."Supplier Vendor Profile"';
    EXECUTE $p$
      CREATE POLICY "Anyone can view supplier vendor profiles"
      ON public."Supplier Vendor Profile"
      FOR SELECT
      USING (true)
    $p$;

    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage supplier vendor profiles" ON public."Supplier Vendor Profile"';
    EXECUTE $p$
      CREATE POLICY "Admins can manage supplier vendor profiles"
      ON public."Supplier Vendor Profile"
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'))
    $p$;
  END IF;
END $apply$;

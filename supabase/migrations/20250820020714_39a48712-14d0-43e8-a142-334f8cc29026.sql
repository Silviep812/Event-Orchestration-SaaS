-- Correct policy syntax and enable RLS on uncovered tables
-- Idempotent: skip tables that were renamed/dropped on remote.

DO $apply$
BEGIN
  IF pg_catalog.to_regclass('public."Registration"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."Registration" ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can access registration" ON public."Registration"';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage registration" ON public."Registration"';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can read registration" ON public."Registration"';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert registration" ON public."Registration"';

    EXECUTE $p$
      CREATE POLICY "Authenticated users can read registration"
      ON public."Registration"
      FOR SELECT
      USING (auth.role() = 'authenticated')
    $p$;

    EXECUTE $p$
      CREATE POLICY "Authenticated users can insert registration"
      ON public."Registration"
      FOR INSERT
      WITH CHECK (auth.role() = 'authenticated')
    $p$;

    EXECUTE $p$
      CREATE POLICY "Admins can manage registration"
      ON public."Registration"
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'))
    $p$;
  END IF;

  IF pg_catalog.to_regclass('public."Subscription_Plans Directory"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."Subscription_Plans Directory" ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public."Subscription_Plans Directory"';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage subscription plans" ON public."Subscription_Plans Directory"';

    EXECUTE $p$
      CREATE POLICY "Anyone can view subscription plans"
      ON public."Subscription_Plans Directory"
      FOR SELECT
      USING (true)
    $p$;

    EXECUTE $p$
      CREATE POLICY "Admins can manage subscription plans"
      ON public."Subscription_Plans Directory"
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'))
    $p$;
  END IF;

  IF pg_catalog.to_regclass('public."Supplier Vendor Profile"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."Supplier Vendor Profile" ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view supplier vendor profiles" ON public."Supplier Vendor Profile"';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage supplier vendor profiles" ON public."Supplier Vendor Profile"';

    EXECUTE $p$
      CREATE POLICY "Anyone can view supplier vendor profiles"
      ON public."Supplier Vendor Profile"
      FOR SELECT
      USING (true)
    $p$;

    EXECUTE $p$
      CREATE POLICY "Admins can manage supplier vendor profiles"
      ON public."Supplier Vendor Profile"
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'))
    $p$;
  END IF;
END $apply$;

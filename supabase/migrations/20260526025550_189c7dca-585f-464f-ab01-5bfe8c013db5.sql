
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS custom_type TEXT;
ALTER TABLE public.entertainments ADD COLUMN IF NOT EXISTS custom_type TEXT;
ALTER TABLE public.transportations ADD COLUMN IF NOT EXISTS custom_type TEXT;
ALTER TABLE public.vendor ADD COLUMN IF NOT EXISTS custom_type TEXT;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS custom_category TEXT;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transportations' AND cmd='INSERT') THEN
    CREATE POLICY "Authenticated users can insert transportations"
      ON public.transportations FOR INSERT TO authenticated
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor' AND cmd='INSERT') THEN
    CREATE POLICY "Authenticated users can insert vendor"
      ON public.vendor FOR INSERT TO authenticated
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

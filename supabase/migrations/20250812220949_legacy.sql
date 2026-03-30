-- CRITICAL SECURITY FIX: Secure the Authorization table (legacy)
-- Remote DBs may have dropped create_userid; 20250821030744+ replaces these policies.
-- When create_userid is missing, skip so db push does not fail; later migrations apply RLS.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Authorization'
      AND column_name = 'create_userid'
  ) THEN
    ALTER TABLE public."Authorization" ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'Authorization'
        AND policyname = 'Users can access their own authorization data'
    ) THEN
      CREATE POLICY "Users can access their own authorization data"
      ON public."Authorization"
      FOR ALL
      USING (create_userid = auth.uid()::text);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'Authorization'
        AND policyname = 'Users can create their own authorization records'
    ) THEN
      CREATE POLICY "Users can create their own authorization records"
      ON public."Authorization"
      FOR INSERT
      WITH CHECK (create_userid = auth.uid()::text);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'Authorization'
        AND policyname = 'Users can update their own authorization records'
    ) THEN
      CREATE POLICY "Users can update their own authorization records"
      ON public."Authorization"
      FOR UPDATE
      USING (create_userid = auth.uid()::text)
      WITH CHECK (create_userid = auth.uid()::text);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'Authorization'
        AND policyname = 'Users can delete their own authorization records'
    ) THEN
      CREATE POLICY "Users can delete their own authorization records"
      ON public."Authorization"
      FOR DELETE
      USING (create_userid = auth.uid()::text);
    END IF;
  END IF;
END $$;

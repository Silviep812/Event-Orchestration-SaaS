-- Legacy RLS for public."Create Event". Skip if table missing.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'Create Event'
      AND c.relkind IN ('r', 'p')
  ) THEN
  ALTER TABLE public."Create Event" ENABLE ROW LEVEL SECURITY;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'Create Event' AND policyname = 'Users can view their own events'
  ) THEN
    CREATE POLICY "Users can view their own events"
    ON public."Create Event"
    FOR SELECT
    USING (userid = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'Create Event' AND policyname = 'Users can create their own events'
  ) THEN
    CREATE POLICY "Users can create their own events"
    ON public."Create Event"
    FOR INSERT
    WITH CHECK (userid = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'Create Event' AND policyname = 'Users can update their own events'
  ) THEN
    CREATE POLICY "Users can update their own events"
    ON public."Create Event"
    FOR UPDATE
    USING (userid = auth.uid()::text)
    WITH CHECK (userid = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'Create Event' AND policyname = 'Users can delete their own events'
  ) THEN
    CREATE POLICY "Users can delete their own events"
    ON public."Create Event"
    FOR DELETE
    USING (userid = auth.uid()::text);
  END IF;
  END IF;
END $$;

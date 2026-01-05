-- Harden RLS on "Create Event" to ensure only authenticated owners can access their rows
BEGIN;

-- Ensure RLS is enabled
ALTER TABLE public."Create Event" ENABLE ROW LEVEL SECURITY;

-- Replace existing policies with authenticated-only scope
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'Create Event' AND policyname = 'Users can create their own events'
  ) THEN
    DROP POLICY "Users can create their own events" ON public."Create Event";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'Create Event' AND policyname = 'Users can delete their own events'
  ) THEN
    DROP POLICY "Users can delete their own events" ON public."Create Event";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'Create Event' AND policyname = 'Users can update their own events'
  ) THEN
    DROP POLICY "Users can update their own events" ON public."Create Event";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'Create Event' AND policyname = 'Users can view their own events'
  ) THEN
    DROP POLICY "Users can view their own events" ON public."Create Event";
  END IF;
END $$;

-- Recreate policies scoped to authenticated users only
CREATE POLICY "Users can create their own events"
ON public."Create Event"
FOR INSERT
TO authenticated
WITH CHECK (userid = (auth.uid())::text);

CREATE POLICY "Users can update their own events"
ON public."Create Event"
FOR UPDATE
TO authenticated
USING (userid = (auth.uid())::text)
WITH CHECK (userid = (auth.uid())::text);

CREATE POLICY "Users can delete their own events"
ON public."Create Event"
FOR DELETE
TO authenticated
USING (userid = (auth.uid())::text);

CREATE POLICY "Users can view their own events"
ON public."Create Event"
FOR SELECT
TO authenticated
USING (userid = (auth.uid())::text);

COMMIT;
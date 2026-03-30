-- Lovable round 3 (4/5): rsvp_submissions — authenticated INSERT + valid book_id (no anon flood)

DO $$
DECLARE
  r RECORD;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'rsvp_submissions'
  ) THEN
    NULL;
  ELSE
    ALTER TABLE public.rsvp_submissions ENABLE ROW LEVEL SECURITY;

    FOR r IN
      SELECT policyname, cmd FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'rsvp_submissions' AND cmd = 'INSERT'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.rsvp_submissions', r.policyname);
    END LOOP;

    EXECUTE $p$
      CREATE POLICY rsvp_submissions_insert_authenticated_valid_booking
      ON public.rsvp_submissions
      FOR INSERT TO authenticated
      WITH CHECK (
        book_id IS NOT NULL
        AND book_id <> ''
        AND EXISTS (
          SELECT 1 FROM public."Bookings Directory" bd
          WHERE bd.book_id = rsvp_submissions.book_id
        )
      )
    $p$;

    REVOKE INSERT ON public.rsvp_submissions FROM anon;
  END IF;
END $$;

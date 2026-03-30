-- Lovable round 2 (1/5): qrcode_submissions — run when app traffic is low to avoid deadlocks.
-- If deadlock: stop npm dev / close other Supabase tabs, wait 30s, retry this file only.

DO $$
DECLARE
  r RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'qrcode_submissions'
  ) THEN
    ALTER TABLE public.qrcode_submissions ENABLE ROW LEVEL SECURITY;
    FOR r IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'qrcode_submissions'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.qrcode_submissions', r.policyname);
    END LOOP;

    EXECUTE $p$
      CREATE POLICY qrcode_submissions_insert_authenticated_valid_booking
      ON public.qrcode_submissions
      FOR INSERT TO authenticated
      WITH CHECK (
        book_id IS NOT NULL
        AND book_id <> ''
        AND EXISTS (
          SELECT 1
          FROM public."Bookings Directory" bd
          WHERE bd.book_id = qrcode_submissions.book_id
        )
      )
    $p$;

    REVOKE INSERT ON public.qrcode_submissions FROM anon;
  END IF;
END $$;

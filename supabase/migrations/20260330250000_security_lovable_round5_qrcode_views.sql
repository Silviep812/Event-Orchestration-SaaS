-- Lovable round 5: qrcode_submissions SELECT (booking owner); re-confirm security_invoker on views.

-- ── qrcode_submissions: allow hosts to read submissions for their bookings ───────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'qrcode_submissions'
  ) THEN
    DROP POLICY IF EXISTS qrcode_submissions_select_booking_owner ON public.qrcode_submissions;
    EXECUTE $p$
      CREATE POLICY qrcode_submissions_select_booking_owner
      ON public.qrcode_submissions
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public."Bookings Directory" bd
          WHERE bd.book_id = qrcode_submissions.book_id
            AND bd.user_id::text = auth.uid()::text
        )
      )
    $p$;
    REVOKE ALL ON public.qrcode_submissions FROM anon;
  END IF;
END $$;

-- ── create_event_safe (view): invoker so base-table RLS applies ───────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'create_event_safe' AND c.relkind = 'v'
  ) THEN
    EXECUTE 'ALTER VIEW public.create_event_safe SET (security_invoker = true)';
    REVOKE ALL ON public.create_event_safe FROM anon;
    GRANT SELECT ON public.create_event_safe TO authenticated;
  END IF;
END $$;

-- ── event_task_timeline_view: re-apply invoker (idempotent) ──────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'event_task_timeline_view' AND c.relkind = 'v'
  ) THEN
    EXECUTE 'ALTER VIEW public.event_task_timeline_view SET (security_invoker = true)';
    REVOKE ALL ON public.event_task_timeline_view FROM anon;
    GRANT SELECT ON public.event_task_timeline_view TO authenticated;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

-- Align physical table name with later security migrations (qrcode_submissions).
-- Runs after 20251004205402 (creates barcode_submissions) and before 20260330200000+ (expects qrcode_submissions).

DO $$
BEGIN
  IF to_regclass('public.barcode_submissions') IS NOT NULL
     AND to_regclass('public.qrcode_submissions') IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE event_object_schema = 'public'
        AND event_object_table = 'barcode_submissions'
        AND trigger_name = 'set_updated_at_barcode'
    ) THEN
      EXECUTE 'ALTER TRIGGER set_updated_at_barcode ON public.barcode_submissions RENAME TO set_updated_at_qrcode';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_barcode_book_id') THEN
      EXECUTE 'ALTER INDEX public.idx_barcode_book_id RENAME TO idx_qrcode_book_id';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_barcode_ticket') THEN
      EXECUTE 'ALTER INDEX public.idx_barcode_ticket RENAME TO idx_qrcode_ticket';
    END IF;

    ALTER TABLE public.barcode_submissions RENAME TO qrcode_submissions;
  END IF;
END $$;

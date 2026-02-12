
-- Rename table
ALTER TABLE IF EXISTS public.barcode_submissions RENAME TO qrcode_submissions;

-- Rename indexes
ALTER INDEX IF EXISTS idx_barcode_book_id RENAME TO idx_qrcode_book_id;
ALTER INDEX IF EXISTS idx_barcode_ticket RENAME TO idx_qrcode_ticket;

-- Rename trigger (no IF EXISTS supported for ALTER TRIGGER)
DO $$ BEGIN
  ALTER TRIGGER set_updated_at_barcode ON public.qrcode_submissions RENAME TO set_updated_at_qrcode;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Drop and recreate RLS policies with updated names
DROP POLICY IF EXISTS "Anyone can view barcode submissions" ON public.qrcode_submissions;
DROP POLICY IF EXISTS "Anyone can create barcode submissions" ON public.qrcode_submissions;

CREATE POLICY "Anyone can view qrcode submissions" ON public.qrcode_submissions FOR SELECT USING (true);
CREATE POLICY "Anyone can create qrcode submissions" ON public.qrcode_submissions FOR INSERT WITH CHECK (true);

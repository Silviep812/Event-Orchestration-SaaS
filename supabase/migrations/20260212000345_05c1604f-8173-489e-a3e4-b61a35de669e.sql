-- Idempotent rename: barcode → QR_Code on "Bookings Directory"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Bookings Directory'
      AND column_name = 'barcode'
  ) THEN
    ALTER TABLE public."Bookings Directory"
      RENAME COLUMN barcode TO "QR_Code";
  END IF;
END;
$$;

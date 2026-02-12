-- Add amenities column to venue_profiles (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'venue_profiles'
      AND column_name = 'amenities'
  ) THEN
    ALTER TABLE public.venue_profiles ADD COLUMN amenities text[] NOT NULL DEFAULT '{}';
  END IF;
END $$;
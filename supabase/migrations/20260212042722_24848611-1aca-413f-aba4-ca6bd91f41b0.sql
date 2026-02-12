DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transportation_profiles'
      AND column_name = 'special_accommodations'
  ) THEN
    ALTER TABLE public.transportation_profiles
      RENAME COLUMN special_accommodations TO amenities;
  END IF;
END $$;
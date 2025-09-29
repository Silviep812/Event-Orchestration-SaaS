-- Check if theme_id column exists and add it if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflows' AND column_name = 'theme_id'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN theme_id integer;
  END IF;
END $$;
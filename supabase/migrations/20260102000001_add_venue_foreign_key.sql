-- Add foreign key constraint between venues and venue_types
-- This is required for PostgREST to recognize the relationship for nested queries

-- First, ensure venue_types has a primary key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conrelid = 'public.venue_types'::regclass 
    AND contype = 'p'
  ) THEN
    ALTER TABLE public.venue_types ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'venues_venue_type_id_fkey'
  ) THEN
    ALTER TABLE public.venues 
    ADD CONSTRAINT venues_venue_type_id_fkey 
    FOREIGN KEY (venue_type_id) 
    REFERENCES public.venue_types(id) 
    ON DELETE SET NULL;
  END IF;
END $$;


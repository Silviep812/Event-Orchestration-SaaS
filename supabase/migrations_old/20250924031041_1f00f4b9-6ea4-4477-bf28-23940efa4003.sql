-- Change theme_id column from UUID to integer foreign key in event_types table
-- Handle NOT NULL constraint and existing UUID data

-- First, drop any existing foreign key constraint on theme_id
ALTER TABLE public.event_types DROP CONSTRAINT IF EXISTS event_types_theme_id_fkey;

-- Remove NOT NULL constraint temporarily
ALTER TABLE public.event_types ALTER COLUMN theme_id DROP NOT NULL;

-- Clear existing UUID data since we can't convert UUIDs to integers
UPDATE public.event_types SET theme_id = NULL;

-- Change the theme_id column type to integer
ALTER TABLE public.event_types 
ALTER COLUMN theme_id TYPE integer USING NULL;

-- Add foreign key constraint if themes table exists with integer id
-- (This will fail gracefully if themes table doesn't exist yet)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'themes' AND table_schema = 'public') THEN
        ALTER TABLE public.event_types 
        ADD CONSTRAINT event_types_theme_id_fkey 
        FOREIGN KEY (theme_id) REFERENCES public.themes(id);
    END IF;
END $$;
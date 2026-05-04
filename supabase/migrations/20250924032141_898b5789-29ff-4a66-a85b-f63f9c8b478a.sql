-- Change theme_id column from UUID to integer foreign key in events table
-- Handle existing UUID data

-- Views over public.events (e.g. event_kpi_view, due_soon_events with e.*) block ALTER TYPE on theme_id
-- when replaying against a DB that already has them from newer migrations.
DROP VIEW IF EXISTS public.event_kpi_view CASCADE;
DROP VIEW IF EXISTS public.due_soon_events CASCADE;
DROP VIEW IF EXISTS public.vendor_category_counts CASCADE;

-- First, drop any existing foreign key constraint on theme_id
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_theme_id_fkey;

-- Clear existing UUID data since we can't convert UUIDs to integers
UPDATE public.events SET theme_id = NULL;

-- Change the theme_id column type to integer
ALTER TABLE public.events 
ALTER COLUMN theme_id TYPE integer USING NULL;

-- Add foreign key constraint to reference themes table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'themes' AND table_schema = 'public') THEN
        ALTER TABLE public.events 
        ADD CONSTRAINT events_theme_id_fkey 
        FOREIGN KEY (theme_id) REFERENCES public.themes(id);
    END IF;
END $$;
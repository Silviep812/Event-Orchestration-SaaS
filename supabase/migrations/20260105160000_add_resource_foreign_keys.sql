-- Add foreign key constraints for resources table
-- This enables PostgREST to discover relationships for API queries

-- Ensure resource_categories has a primary key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.resource_categories'::regclass
    AND contype = 'p'
  ) THEN
    ALTER TABLE public.resource_categories ADD PRIMARY KEY (id);
    RAISE NOTICE 'Added PRIMARY KEY to resource_categories';
  END IF;
END $$;

-- Ensure resource_status has a primary key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.resource_status'::regclass
    AND contype = 'p'
  ) THEN
    ALTER TABLE public.resource_status ADD PRIMARY KEY (id);
    RAISE NOTICE 'Added PRIMARY KEY to resource_status';
  END IF;
END $$;

-- Add foreign key constraint for resources.category_id -> resource_categories.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'resources_category_id_fkey'
    AND conrelid = 'public.resources'::regclass
  ) THEN
    ALTER TABLE public.resources
    ADD CONSTRAINT resources_category_id_fkey
    FOREIGN KEY (category_id) REFERENCES public.resource_categories(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added foreign key constraint: resources.category_id -> resource_categories.id';
  END IF;
END $$;

-- Add foreign key constraint for resources.status_id -> resource_status.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'resources_status_id_fkey'
    AND conrelid = 'public.resources'::regclass
  ) THEN
    ALTER TABLE public.resources
    ADD CONSTRAINT resources_status_id_fkey
    FOREIGN KEY (status_id) REFERENCES public.resource_status(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added foreign key constraint: resources.status_id -> resource_status.id';
  END IF;
END $$;

-- Add foreign key constraint for resources.event_id -> events.id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'resources_event_id_fkey'
    AND conrelid = 'public.resources'::regclass
  ) THEN
    -- Check if events table has primary key
    IF EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = 'public.events'::regclass
      AND contype = 'p'
    ) THEN
      ALTER TABLE public.resources
      ADD CONSTRAINT resources_event_id_fkey
      FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
      RAISE NOTICE 'Added foreign key constraint: resources.event_id -> events.id';
    ELSE
      RAISE NOTICE 'Skipping resources.event_id foreign key - events table has no primary key';
    END IF;
  END IF;
END $$;


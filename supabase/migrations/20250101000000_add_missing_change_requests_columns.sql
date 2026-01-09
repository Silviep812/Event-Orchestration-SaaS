-- Create change_requests table if it doesn't exist, or add missing columns if it does
-- This migration is safe to run multiple times

-- First, ensure the change_type enum exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_type 
    WHERE typname = 'change_type'
  ) THEN
    CREATE TYPE change_type AS ENUM ('event_update', 'task_update', 'workflow_update', 'venue_update', 'supplier_update', 'transport_update', 'entertainment_update');
    RAISE NOTICE 'Created change_type enum';
  END IF;
END $$;

-- Ensure change_status enum exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_type 
    WHERE typname = 'change_status'
  ) THEN
    CREATE TYPE change_status AS ENUM ('pending', 'approved', 'rejected', 'applied', 'cancelled');
    RAISE NOTICE 'Created change_status enum';
  END IF;
END $$;

-- Ensure task_priority enum exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_type 
    WHERE typname = 'task_priority'
  ) THEN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
    RAISE NOTICE 'Created task_priority enum';
  END IF;
END $$;

-- Check if change_requests table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'change_requests'
  ) THEN
    -- Create the table with all columns
    CREATE TABLE public.change_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT,
      status change_status NOT NULL DEFAULT 'pending',
      priority task_priority NOT NULL DEFAULT 'medium',
      
      -- Relationships
      event_id TEXT,
      task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
      
      -- Request metadata
      requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      applied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      
      -- Timestamps
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      approved_at TIMESTAMP WITH TIME ZONE,
      applied_at TIMESTAMP WITH TIME ZONE,
      
      -- Additional fields
      rejection_reason TEXT,
      change_type change_type DEFAULT 'event_update',
      field_changes JSONB
    );

    -- Create indexes
    CREATE INDEX idx_change_requests_status ON public.change_requests(status);
    CREATE INDEX idx_change_requests_event_id ON public.change_requests(event_id);
    CREATE INDEX idx_change_requests_task_id ON public.change_requests(task_id);
    CREATE INDEX idx_change_requests_requested_by ON public.change_requests(requested_by);
    CREATE INDEX idx_change_requests_created_at ON public.change_requests(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_change_requests_field_changes ON public.change_requests USING GIN (field_changes);

    -- Enable RLS
    ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

    RAISE NOTICE 'Created change_requests table';
  ELSE
    -- Table exists, add missing columns
    RAISE NOTICE 'change_requests table already exists, checking for missing columns...';
    
    -- Add description column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'change_requests' 
      AND column_name = 'description'
    ) THEN
      ALTER TABLE public.change_requests 
      ADD COLUMN description TEXT;
      RAISE NOTICE 'Added description column';
    END IF;

    -- Add change_type column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'change_requests' 
      AND column_name = 'change_type'
    ) THEN
      ALTER TABLE public.change_requests 
      ADD COLUMN change_type change_type DEFAULT 'event_update';
      RAISE NOTICE 'Added change_type column';
    END IF;

    -- Add field_changes column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'change_requests' 
      AND column_name = 'field_changes'
    ) THEN
      ALTER TABLE public.change_requests 
      ADD COLUMN field_changes JSONB;
      CREATE INDEX IF NOT EXISTS idx_change_requests_field_changes ON public.change_requests USING GIN (field_changes);
      RAISE NOTICE 'Added field_changes column';
    END IF;
  END IF;
END $$;

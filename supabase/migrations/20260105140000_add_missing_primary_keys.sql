-- Add PRIMARY KEY constraints to all tables that have id columns but no primary key
-- This migration ensures all tables have primary keys for Supabase PostgREST compatibility

DO $$
DECLARE
    table_record RECORD;
    pk_exists BOOLEAN;
    id_column_type TEXT;
BEGIN
    -- Loop through all tables in public schema
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE 'pg_%'
    LOOP
        -- Check if table has an id column
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = table_record.table_name 
            AND column_name = 'id'
        ) THEN
            -- Check if primary key already exists
            SELECT EXISTS (
                SELECT 1 
                FROM pg_constraint 
                WHERE conrelid = ('public.' || quote_ident(table_record.table_name))::regclass
                AND contype = 'p'
            ) INTO pk_exists;
            
            -- If no primary key exists, add it
            IF NOT pk_exists THEN
                BEGIN
                    EXECUTE format('ALTER TABLE public.%I ADD PRIMARY KEY (id)', table_record.table_name);
                    RAISE NOTICE 'Added PRIMARY KEY to table: %', table_record.table_name;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Could not add PRIMARY KEY to table %: %', table_record.table_name, SQLERRM;
                END;
            END IF;
        END IF;
    END LOOP;
END $$;

-- Handle special cases for tables with composite or different primary key columns

-- cm_event_members: composite primary key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.cm_event_members'::regclass 
        AND contype = 'p'
    ) THEN
        ALTER TABLE public.cm_event_members ADD PRIMARY KEY (user_id, event_id);
        RAISE NOTICE 'Added composite PRIMARY KEY to cm_event_members';
    END IF;
END $$;

-- role_permission_groups: composite primary key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.role_permission_groups'::regclass 
        AND contype = 'p'
    ) THEN
        ALTER TABLE public.role_permission_groups ADD PRIMARY KEY (role, permission_group);
        RAISE NOTICE 'Added composite PRIMARY KEY to role_permission_groups';
    END IF;
END $$;

-- Handle tables with quoted names that have id columns
DO $$
DECLARE
    quoted_table TEXT;
BEGIN
    -- Registration table
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public."Registration"'::regclass 
        AND contype = 'p'
    ) THEN
        ALTER TABLE public."Registration" ADD PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to Registration';
    END IF;
    
    -- Service Profile table
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public."Service Profile"'::regclass 
        AND contype = 'p'
    ) THEN
        ALTER TABLE public."Service Profile" ADD PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to Service Profile';
    END IF;
    
    -- Entertainment Directory
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public."Entertainment Directory"'::regclass 
        AND contype = 'p'
    ) THEN
        ALTER TABLE public."Entertainment Directory" ADD PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to Entertainment Directory';
    END IF;
    
    -- Entertainment Profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public."Entertainment Profile"'::regclass 
        AND contype = 'p'
    ) THEN
        ALTER TABLE public."Entertainment Profile" ADD PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to Entertainment Profile';
    END IF;
    
    -- Hospitality Directory
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public."Hospitality Directory"'::regclass 
        AND contype = 'p'
    ) THEN
        ALTER TABLE public."Hospitality Directory" ADD PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to Hospitality Directory';
    END IF;
    
    -- Vendor Directory
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public."Vendor Directory"'::regclass 
        AND contype = 'p'
    ) THEN
        ALTER TABLE public."Vendor Directory" ADD PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to Vendor Directory';
    END IF;
    
    -- Venue Directory
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public."Venue Directory"'::regclass 
        AND contype = 'p'
    ) THEN
        ALTER TABLE public."Venue Directory" ADD PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to Venue Directory';
    END IF;
    
    -- Supplier Directory
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public."Supplier Directory"'::regclass 
        AND contype = 'p'
    ) THEN
        ALTER TABLE public."Supplier Directory" ADD PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to Supplier Directory';
    END IF;
    
    -- Subscription_Plans Directory
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public."Subscription_Plans Directory"'::regclass 
        AND contype = 'p'
    ) THEN
        ALTER TABLE public."Subscription_Plans Directory" ADD PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to Subscription_Plans Directory';
    END IF;
    
    -- User Profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public."User Profile"'::regclass 
        AND contype = 'p'
    ) THEN
        ALTER TABLE public."User Profile" ADD PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY to User Profile';
    END IF;
END $$;


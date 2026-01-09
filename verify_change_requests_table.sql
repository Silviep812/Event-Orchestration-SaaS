-- Verification script - Run this to verify the change_requests table was created correctly

-- Check if table exists
SELECT 
  'Table exists: ' || EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'change_requests'
  )::text as table_status;

-- List all columns in the table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'change_requests'
ORDER BY ordinal_position;

-- Check if indexes exist
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'change_requests';


-- Remove duplicate venue entries
-- Keep the oldest entry (lowest id) for each duplicate

-- First, identify and delete duplicates based on business_name and city
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(business_name), LOWER(city) 
      ORDER BY created_at ASC, id ASC
    ) as rn
  FROM venues
)
DELETE FROM venues
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Log the cleanup
DO $$
BEGIN
  RAISE NOTICE 'Duplicate venue entries have been removed';
END $$;
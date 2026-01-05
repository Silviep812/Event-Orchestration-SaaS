-- Remove duplicate venues, keeping the oldest entry for each unique business_name and city combination
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY business_name, city, state 
      ORDER BY created_at ASC, id ASC
    ) as rn
  FROM venues
)
DELETE FROM venues
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
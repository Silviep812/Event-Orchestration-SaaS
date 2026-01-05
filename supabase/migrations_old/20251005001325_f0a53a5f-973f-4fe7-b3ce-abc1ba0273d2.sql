-- Remove duplicate entries for Marriott Baltimore Waterfront, keeping only the first one by created_at
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY business_name ORDER BY created_at ASC) as rn
  FROM hospitality_profiles
  WHERE business_name = 'Marriott Baltimore Waterfront'
)
DELETE FROM hospitality_profiles
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
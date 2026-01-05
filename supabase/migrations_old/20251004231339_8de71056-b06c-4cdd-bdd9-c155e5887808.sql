-- Add cost column to hospitality_profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'hospitality_profiles' 
                 AND column_name = 'cost') THEN
    ALTER TABLE hospitality_profiles ADD COLUMN cost numeric;
  END IF;
END $$;

-- Update hospitality_profiles with cost from venues table
UPDATE hospitality_profiles hp
SET cost = v.cost
FROM venues v
WHERE hp.business_name = v.business_name
  AND hp.city = v.city
  AND v.venue_type_id = '9'
  AND v.cost IS NOT NULL;
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
CROSS JOIN LATERAL (
  SELECT COALESCE(
    (SELECT id FROM public.venue_types WHERE name = 'Hospitality Location' ORDER BY id LIMIT 1),
    (SELECT id FROM public.venue_types WHERE name = 'Other' ORDER BY id LIMIT 1)
  ) AS id
) ht
WHERE hp.business_name = v.business_name
  AND hp.city = v.city
  AND v.venue_type_id = ht.id
  AND ht.id IS NOT NULL
  AND v.cost IS NOT NULL;
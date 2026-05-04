-- Remove incorrectly migrated state parks from hospitality_profiles
DELETE FROM hospitality_profiles
WHERE hospitality_type = 4
  AND (business_name ILIKE '%state park%' OR business_name ILIKE '%park%');

-- Migrate actual resorts from venue_type "Resort Location" (legacy id 4)
INSERT INTO hospitality_profiles (
  business_name,
  contact_name,
  email,
  phone_number,
  website,
  city,
  state,
  zip,
  cost,
  hospitality_type,
  created_at,
  updated_at
)
SELECT 
  v.business_name,
  v.contact_name,
  v.email,
  v.phone_number,
  NULL as website,
  v.city,
  v.state,
  v.zip,
  v.cost,
  4 as hospitality_type,  -- 4 = resort
  v.created_at,
  now() as updated_at
FROM venues v
WHERE v.venue_type_id = (SELECT id FROM public.venue_types WHERE name = 'Resort Location' ORDER BY id LIMIT 1)
  AND (SELECT id FROM public.venue_types WHERE name = 'Resort Location' ORDER BY id LIMIT 1) IS NOT NULL
  AND v.business_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM hospitality_profiles hp 
    WHERE hp.business_name = v.business_name 
    AND hp.city = v.city
  );

-- Also migrate resorts from hospitality-type venues that have "resort" in name
INSERT INTO hospitality_profiles (
  business_name,
  contact_name,
  email,
  phone_number,
  website,
  city,
  state,
  zip,
  cost,
  hospitality_type,
  created_at,
  updated_at
)
SELECT 
  v.business_name,
  v.contact_name,
  v.email,
  v.phone_number,
  NULL as website,
  v.city,
  v.state,
  v.zip,
  v.cost,
  4 as hospitality_type,
  v.created_at,
  now() as updated_at
FROM venues v
WHERE v.venue_type_id = (
    SELECT COALESCE(
      (SELECT id FROM public.venue_types WHERE name = 'Hospitality Location' ORDER BY id LIMIT 1),
      (SELECT id FROM public.venue_types WHERE name = 'Other' ORDER BY id LIMIT 1)
    )
  )
  AND (
    SELECT COALESCE(
      (SELECT id FROM public.venue_types WHERE name = 'Hospitality Location' ORDER BY id LIMIT 1),
      (SELECT id FROM public.venue_types WHERE name = 'Other' ORDER BY id LIMIT 1)
    )
  ) IS NOT NULL
  AND v.business_name ILIKE '%resort%'
  AND v.business_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM hospitality_profiles hp 
    WHERE hp.business_name = v.business_name 
    AND hp.city = v.city
  );

-- Delete migrated resorts from venues table
DELETE FROM venues v
WHERE (
    v.venue_type_id = (SELECT id FROM public.venue_types WHERE name = 'Resort Location' ORDER BY id LIMIT 1)
    OR (
      v.venue_type_id = (
        SELECT COALESCE(
          (SELECT id FROM public.venue_types WHERE name = 'Hospitality Location' ORDER BY id LIMIT 1),
          (SELECT id FROM public.venue_types WHERE name = 'Other' ORDER BY id LIMIT 1)
        )
      )
      AND v.business_name ILIKE '%resort%'
    )
  )
  AND v.business_name IN (
    SELECT business_name 
    FROM hospitality_profiles 
    WHERE hospitality_type = 4
  );

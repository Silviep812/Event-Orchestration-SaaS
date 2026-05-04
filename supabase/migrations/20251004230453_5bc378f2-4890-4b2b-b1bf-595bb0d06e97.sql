-- Migrate hotels and Airbnbs from venues table to hospitality_profiles table

WITH hospitality_venue_type AS (
  SELECT COALESCE(
    (SELECT id FROM public.venue_types WHERE name = 'Hospitality Location' ORDER BY id LIMIT 1),
    (SELECT id FROM public.venue_types WHERE name = 'Other' ORDER BY id LIMIT 1)
  ) AS id
)
-- First, add hotels from venues (identifying them by name patterns)
INSERT INTO hospitality_profiles (business_name, contact_name, email, phone_number, city, state, zip, hospitality_type)
SELECT 
  v.business_name,
  v.contact_name,
  v.email,
  v.phone_number,
  v.city,
  v.state,
  v.zip,
  1 as hospitality_type  -- 1 = hotel
FROM venues v
CROSS JOIN hospitality_venue_type ht
WHERE v.venue_type_id = ht.id
  AND ht.id IS NOT NULL
  AND (
    v.business_name ILIKE '%hotel%' OR
    v.business_name ILIKE '%marriott%' OR
    v.business_name ILIKE '%hilton%' OR
    v.business_name ILIKE '%hyatt%' OR
    v.business_name ILIKE '%westin%' OR
    v.business_name ILIKE '%resort%' OR
    v.business_name ILIKE '%inn%' OR
    v.business_name ILIKE '%four seasons%' OR
    v.business_name ILIKE '%pendry%' OR
    v.business_name ILIKE '%monaco%' OR
    v.business_name ILIKE '%sonesta%' OR
    v.business_name ILIKE '%gaylord%' OR
    v.business_name ILIKE '%clarion%' OR
    v.business_name ILIKE '%homewood%' OR
    v.business_name ILIKE '%hampton%' OR
    v.business_name ILIKE '%graduate%'
  )
ON CONFLICT DO NOTHING;

-- Then add Airbnbs from venues (identifying them by name patterns)
WITH hospitality_venue_type AS (
  SELECT COALESCE(
    (SELECT id FROM public.venue_types WHERE name = 'Hospitality Location' ORDER BY id LIMIT 1),
    (SELECT id FROM public.venue_types WHERE name = 'Other' ORDER BY id LIMIT 1)
  ) AS id
)
INSERT INTO hospitality_profiles (business_name, contact_name, email, phone_number, city, state, zip, hospitality_type)
SELECT 
  v.business_name,
  v.contact_name,
  v.email,
  v.phone_number,
  v.city,
  v.state,
  v.zip,
  3 as hospitality_type  -- 3 = airbnb
FROM venues v
CROSS JOIN hospitality_venue_type ht
WHERE v.venue_type_id = ht.id
  AND ht.id IS NOT NULL
  AND (
    v.business_name ILIKE '%townhouse%' OR
    v.business_name ILIKE '%loft%' OR
    v.business_name ILIKE '%rooftop%' OR
    v.business_name ILIKE '%mansion%' OR
    v.business_name ILIKE '%estate%' OR
    v.business_name ILIKE '%manor%' OR
    v.business_name ILIKE '%house%' OR
    v.business_name ILIKE '%villa%' OR
    v.business_name ILIKE '%retreat%' OR
    v.business_name ILIKE '%beach house%' OR
    v.business_name ILIKE '%waterfront%' OR
    v.business_name ILIKE '%lake%'
  )
  AND v.business_name NOT ILIKE '%hotel%'
  AND v.business_name NOT ILIKE '%resort%'
  AND v.business_name NOT ILIKE '%inn%'
ON CONFLICT DO NOTHING;
-- Migrate hotels and Airbnbs from venues table to hospitality_profiles table

-- First, add hotels from venues (identifying them by name patterns)
INSERT INTO hospitality_profiles (business_name, contact_name, email, phone_number, city, state, zip, hospitality_type)
SELECT 
  business_name,
  contact_name,
  email,
  phone_number,
  city,
  state,
  zip,
  1 as hospitality_type  -- 1 = hotel
FROM venues
WHERE venue_type_id = '9'
  AND (
    business_name ILIKE '%hotel%' OR
    business_name ILIKE '%marriott%' OR
    business_name ILIKE '%hilton%' OR
    business_name ILIKE '%hyatt%' OR
    business_name ILIKE '%westin%' OR
    business_name ILIKE '%resort%' OR
    business_name ILIKE '%inn%' OR
    business_name ILIKE '%four seasons%' OR
    business_name ILIKE '%pendry%' OR
    business_name ILIKE '%monaco%' OR
    business_name ILIKE '%sonesta%' OR
    business_name ILIKE '%gaylord%' OR
    business_name ILIKE '%clarion%' OR
    business_name ILIKE '%homewood%' OR
    business_name ILIKE '%hampton%' OR
    business_name ILIKE '%graduate%'
  )
ON CONFLICT DO NOTHING;

-- Then add Airbnbs from venues (identifying them by name patterns)
INSERT INTO hospitality_profiles (business_name, contact_name, email, phone_number, city, state, zip, hospitality_type)
SELECT 
  business_name,
  contact_name,
  email,
  phone_number,
  city,
  state,
  zip,
  3 as hospitality_type  -- 3 = airbnb
FROM venues
WHERE venue_type_id = '9'
  AND (
    business_name ILIKE '%townhouse%' OR
    business_name ILIKE '%loft%' OR
    business_name ILIKE '%rooftop%' OR
    business_name ILIKE '%mansion%' OR
    business_name ILIKE '%estate%' OR
    business_name ILIKE '%manor%' OR
    business_name ILIKE '%house%' OR
    business_name ILIKE '%villa%' OR
    business_name ILIKE '%retreat%' OR
    business_name ILIKE '%beach house%' OR
    business_name ILIKE '%waterfront%' OR
    business_name ILIKE '%lake%'
  )
  AND business_name NOT ILIKE '%hotel%'
  AND business_name NOT ILIKE '%resort%'
  AND business_name NOT ILIKE '%inn%'
ON CONFLICT DO NOTHING;
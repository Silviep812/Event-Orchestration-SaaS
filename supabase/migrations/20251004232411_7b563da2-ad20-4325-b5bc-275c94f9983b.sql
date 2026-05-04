-- Ensure a "resort" row exists for FK (many remotes never had legacy id 2; 64346 uses id 4 for resort)
INSERT INTO public.hospitality_types (name)
SELECT 'Resort'
WHERE NOT EXISTS (
  SELECT 1 FROM public.hospitality_types t
  WHERE LOWER(trim(t.name)) IN ('resort', 'resorts')
);

-- Migrate resorts from venues (venue type "Resort Location", not recreation id 5)
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
  (SELECT t.id FROM public.hospitality_types t
   WHERE LOWER(trim(t.name)) IN ('resort', 'resorts')
   ORDER BY t.id LIMIT 1),
  v.created_at,
  now() as updated_at
FROM venues v
WHERE v.venue_type_id = (SELECT id FROM public.venue_types WHERE name = 'Resort Location' ORDER BY id LIMIT 1)
  AND (SELECT id FROM public.venue_types WHERE name = 'Resort Location' ORDER BY id LIMIT 1) IS NOT NULL
  AND v.business_name IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.hospitality_types t
    WHERE LOWER(trim(t.name)) IN ('resort', 'resorts')
  )
  AND NOT EXISTS (
    SELECT 1 FROM hospitality_profiles hp 
    WHERE hp.business_name = v.business_name 
    AND hp.city = v.city
  );

-- Delete migrated resorts from venues table
DELETE FROM venues v
WHERE v.venue_type_id = (SELECT id FROM public.venue_types WHERE name = 'Resort Location' ORDER BY id LIMIT 1)
  AND v.business_name IN (
    SELECT hp.business_name 
    FROM hospitality_profiles hp
    JOIN public.hospitality_types t ON t.id = hp.hospitality_type
    WHERE LOWER(trim(t.name)) IN ('resort', 'resorts')
  );

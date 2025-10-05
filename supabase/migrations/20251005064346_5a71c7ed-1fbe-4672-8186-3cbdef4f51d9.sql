-- Add motel hospitality type if missing
INSERT INTO hospitality_types (name) VALUES ('motel')
ON CONFLICT DO NOTHING;

-- Migrate hotel/resort/inn/lodge venues from Venue Profile to Hospitality Profile
INSERT INTO "Hospitality Profile" (
  hosp_biz_name,
  hosp_contact_name,
  hosp_contact_nbr,
  hosp_location,
  hosp_price,
  hospitality_type,
  hosp_type_id
)
SELECT 
  ven_biz_name,
  ven_contact_name,
  ven_contact_ph_nbr,
  CASE 
    WHEN ven_locatiom IS NOT NULL THEN ARRAY[ven_locatiom]
    ELSE NULL
  END,
  ven_price,
  CASE
    WHEN LOWER(ven_biz_name) LIKE '%hotel%' OR LOWER(ven_biz_name) LIKE '%inn%' THEN 1
    WHEN LOWER(ven_biz_name) LIKE '%resort%' THEN 4
    WHEN LOWER(ven_biz_name) LIKE '%motel%' THEN (SELECT id FROM hospitality_types WHERE LOWER(name) = 'motel')
    WHEN LOWER(ven_biz_name) LIKE '%airbnb%' THEN 3
    ELSE 5
  END,
  'hospitality'::budget_category
FROM "Venue Profile"
WHERE venue_type_id = '14' 
  AND (
    LOWER(ven_biz_name) LIKE '%hotel%' 
    OR LOWER(ven_biz_name) LIKE '%resort%'
    OR LOWER(ven_biz_name) LIKE '%inn%'
    OR LOWER(ven_biz_name) LIKE '%lodge%'
    OR LOWER(ven_biz_name) LIKE '%motel%'
    OR LOWER(ven_biz_name) LIKE '%airbnb%'
  );

-- Delete those venues from Venue Profile since they're now hospitality
DELETE FROM "Venue Profile"
WHERE venue_type_id = '14' 
  AND (
    LOWER(ven_biz_name) LIKE '%hotel%' 
    OR LOWER(ven_biz_name) LIKE '%resort%'
    OR LOWER(ven_biz_name) LIKE '%inn%'
    OR LOWER(ven_biz_name) LIKE '%lodge%'
    OR LOWER(ven_biz_name) LIKE '%motel%'
    OR LOWER(ven_biz_name) LIKE '%airbnb%'
  );

-- Remove the incorrectly added venue types
DELETE FROM venue_types WHERE name IN (
  'Hospitality/Hotels',
  'Hospitality/Resorts', 
  'Hospitality/Motel',
  'Hospitality/Airbnb'
);
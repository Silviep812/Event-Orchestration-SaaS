-- Add all hospitality types from Hospitality Directory as venue types
INSERT INTO venue_types (name) VALUES 
  ('Hospitality/Motel'),
  ('Hospitality/Airbnb')
ON CONFLICT DO NOTHING;

-- Now update venues to use the proper hospitality types based on their names
-- Hotels
UPDATE "Venue Profile" 
SET venue_type_id = '15'
WHERE venue_type_id = '14' 
  AND (LOWER(ven_biz_name) LIKE '%hotel%' OR LOWER(ven_biz_name) LIKE '%inn%' OR LOWER(ven_biz_name) LIKE '%lodge%');

-- Resorts
UPDATE "Venue Profile" 
SET venue_type_id = '16'
WHERE venue_type_id = '14' 
  AND LOWER(ven_biz_name) LIKE '%resort%';

-- Motels (will be id 17)
UPDATE "Venue Profile" 
SET venue_type_id = (SELECT id::text FROM venue_types WHERE name = 'Hospitality/Motel')
WHERE venue_type_id = '14' 
  AND LOWER(ven_biz_name) LIKE '%motel%';

-- Airbnb/Vacation Rentals (will be id 18)
UPDATE "Venue Profile" 
SET venue_type_id = (SELECT id::text FROM venue_types WHERE name = 'Hospitality/Airbnb')
WHERE venue_type_id = '14' 
  AND (LOWER(ven_biz_name) LIKE '%airbnb%' OR LOWER(ven_biz_name) LIKE '%vacation rental%' OR LOWER(ven_biz_name) LIKE '%vrbo%');
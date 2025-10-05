-- Add new venue types for Hospitality
INSERT INTO venue_types (name) VALUES 
  ('Hospitality/Hotels'),
  ('Hospitality/Resorts');

-- Update venues with "Hotel" in their business name to Hospitality/Hotels type
UPDATE "Venue Profile" 
SET venue_type_id = (SELECT id::text FROM venue_types WHERE name = 'Hospitality/Hotels')
WHERE venue_type_id = '14' 
  AND (LOWER(ven_biz_name) LIKE '%hotel%' OR LOWER(ven_biz_name) LIKE '%inn%');

-- Update venues with "Resort" in their business name to Hospitality/Resorts type
UPDATE "Venue Profile" 
SET venue_type_id = (SELECT id::text FROM venue_types WHERE name = 'Hospitality/Resorts')
WHERE venue_type_id = '14' 
  AND LOWER(ven_biz_name) LIKE '%resort%';
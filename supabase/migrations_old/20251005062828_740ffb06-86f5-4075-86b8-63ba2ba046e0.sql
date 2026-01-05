-- Update existing venues using "Hospitality Location" or "Resort Location" to "Other"
UPDATE venues 
SET venue_type_id = 14 
WHERE venue_type_id IN (4, 9);

-- Delete "Resort Location" venue type
DELETE FROM venue_types WHERE id = 4;

-- Delete "Hospitality Location" venue type  
DELETE FROM venue_types WHERE id = 9;
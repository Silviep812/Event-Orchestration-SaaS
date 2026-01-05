-- Update venue types to replace government locations with parks
UPDATE venue_types 
SET name = 'Local Parks' 
WHERE name = 'Local Government Location';

UPDATE venue_types 
SET name = 'State Parks' 
WHERE name = 'State Government Location';
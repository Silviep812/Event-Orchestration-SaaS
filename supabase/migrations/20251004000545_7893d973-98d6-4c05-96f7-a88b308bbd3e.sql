-- Fix the theme_id for all Health and Wellness groups to use correct theme id (8)
-- Update Peaceful group
UPDATE event_types 
SET theme_id = 8 
WHERE name = 'Peaceful' AND parent_id = 16 AND theme_id = 2;

-- Update Spiritual group
UPDATE event_types 
SET theme_id = 8 
WHERE name = 'Spiritual' AND parent_id = 16 AND theme_id = 2;

-- Update Rejuvenating group
UPDATE event_types 
SET theme_id = 8 
WHERE name = 'Rejuvenating' AND parent_id = 16 AND theme_id = 2;

-- Update Holistic group
UPDATE event_types 
SET theme_id = 8 
WHERE name = 'Holistic' AND parent_id = 16 AND theme_id = 2;

-- Update all child event types under these groups to also use theme_id = 8
UPDATE event_types 
SET theme_id = 8 
WHERE parent_id IN (
  SELECT id FROM event_types 
  WHERE name IN ('Peaceful', 'Spiritual', 'Rejuvenating', 'Holistic') 
  AND parent_id = 16
) AND theme_id = 2;

-- Remove duplicate Holistic entry if it exists
DELETE FROM event_types 
WHERE id = 44 AND name = 'Holistic' AND parent_id IS NULL;
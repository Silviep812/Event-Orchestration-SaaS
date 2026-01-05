-- Update the parent Health & Wellness entry to use theme_id = 8
UPDATE event_types 
SET theme_id = 8 
WHERE id = 16 AND name = 'Health & Wellness' AND theme_id = 2;
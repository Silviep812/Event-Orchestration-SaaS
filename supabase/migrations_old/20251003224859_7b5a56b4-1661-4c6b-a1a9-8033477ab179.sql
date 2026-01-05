-- Migrate existing events from old Dining categories to new ones
-- Mapping:
-- Farm to Table (4) → Contemporary (166) - fits modern farm-to-table concept
-- Upscale Restaurant (5) → Fine Dining (199) - upscale = fine dining
-- Dinner Party (6) → Buffet (39) - parties often have buffet-style service
-- Dinner Theatre (38) → Contemporary (166) - entertainment dining experience

UPDATE events 
SET type_id = 166 
WHERE type_id IN (4, 38);  -- Farm to Table and Dinner Theatre → Contemporary

UPDATE events 
SET type_id = 199 
WHERE type_id = 5;  -- Upscale Restaurant → Fine Dining

UPDATE events 
SET type_id = 39 
WHERE type_id = 6;  -- Dinner Party → Buffet

-- Now safely delete the old event types
DELETE FROM event_types 
WHERE theme_id = 7 
  AND parent_id IS NULL 
  AND id IN (4, 5, 6, 38);
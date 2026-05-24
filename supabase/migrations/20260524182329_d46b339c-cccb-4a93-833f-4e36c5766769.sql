-- 1. Merge duplicate "Rejuvenating" (584 → 261)
UPDATE event_types SET parent_id = 261 WHERE parent_id = 584;
DELETE FROM event_types WHERE id = 584;

-- 2. Merge duplicate "Holistic" (605 → 262)
UPDATE event_types SET parent_id = 262 WHERE parent_id = 605;
DELETE FROM event_types WHERE id = 605;

-- 3. Tag the whole Personal/wellness subtree with theme_id = 5 (Health and Wellness)
--    Root + direct category children + their type children.
WITH RECURSIVE tree AS (
  SELECT id FROM event_types WHERE id = 16
  UNION ALL
  SELECT et.id FROM event_types et JOIN tree ON et.parent_id = tree.id
)
UPDATE event_types
SET theme_id = 5
WHERE id IN (SELECT id FROM tree);
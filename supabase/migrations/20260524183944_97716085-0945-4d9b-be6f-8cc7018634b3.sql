
-- 1. Create Dining theme
INSERT INTO "Themes Directory Catalog" (name, description, premium)
VALUES ('Dining', 'Curated dining experiences — contemporary menus, buffets, and fine dining', false);

-- 2. Reparent Contemporary (490), Buffet (508), Fine Dining (523) and ALL their children to Dining theme
UPDATE event_types
SET theme_id = (SELECT id FROM "Themes Directory Catalog" WHERE name = 'Dining' LIMIT 1)
WHERE id IN (490, 508, 523)
   OR parent_id IN (490, 508, 523);

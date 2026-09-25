-- Task 2A (A2): "Dining > category > Buffet loads sub-types from Marketplace"
-- (IEP M5_Task 2 V1.3 UI_UX fix(s) 9_24_26.pdf, Sidebar Theme changes)
--
-- Buffet carried 30 children: 14 real buffet service styles (Breakfast Buffet, Carving
-- Station, Salad Bar, ...) and 16 artisan crafts (Blacksmith, Potter, Glassblower,
-- Jeweler, ...). The artisans belong to the Marketplace theme, which already has an
-- "Artisans" root (id 424) sitting empty with zero children.
--
-- Each misparented artisan also carried exactly one child: a duplicate of itself
-- (Buffet > Blacksmith > Blacksmith). That is the same AI-generator damage the UI/UX
-- document describes, one level deeper.
--
-- Verified before writing this migration:
--   * none of the 16 artisan rows, nor their 16 duplicate children, are referenced by
--     any row in public.events (type_id), so no event loses its type
--   * "Artisans" (424) has no children, so no name collides when they move
--   * every one of the 16 duplicate children is a childless leaf
--
-- Deliberately NOT addressed here: the table has 271 names appearing more than once and
-- a self-loop (id 345 "Spa Days", parent_id = 345). 9 of 16 typed events point at
-- duplicate-named rows, so a blanket dedupe would silently retype real events. That needs
-- its own migration and a decision about which copy is canonical.

BEGIN;

-- 1. Drop the self-duplicating children (Buffet > Blacksmith > Blacksmith).
--    Restricted to childless, unreferenced leaves under the 16 known artisan rows.
DELETE FROM public.event_types child
WHERE child.parent_id IN (11,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136)
  AND EXISTS (
    SELECT 1 FROM public.event_types parent
    WHERE parent.id = child.parent_id
      AND parent.name = child.name
  )
  AND NOT EXISTS (SELECT 1 FROM public.event_types k WHERE k.parent_id = child.id)
  AND NOT EXISTS (SELECT 1 FROM public.events e WHERE e.type_id = child.id);

-- 2. Move the artisans out of Dining/Buffet and under Marketplace > Artisans.
UPDATE public.event_types
SET parent_id = 424,
    theme_id  = (SELECT id FROM public."Themes Directory Catalog" WHERE name = 'Marketplace')
WHERE id IN (11,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136)
  AND NOT EXISTS (
    SELECT 1 FROM public.event_types sibling
    WHERE sibling.parent_id = 424
      AND sibling.name = public.event_types.name
      AND sibling.id <> public.event_types.id
  );

COMMIT;

-- Task 2A: repair event_types structural integrity.
--
-- Three distinct defects, all consequences of there being no FK on parent_id:
--
--   1. A self-loop: id 345 "Spa Days" has parent_id = 345. A recursive walk from the
--      roots never reaches it, so it and its 5 children are invisible in the UI.
--   2. 37 rows whose parent_id references a row that no longer exists.
--   3. 11 exact twins (same name, same parent), all at root level.
--
-- Together these made 49 of 741 rows unreachable from any root.
--
-- CANONICAL-COPY RULE for the twins, applied in this order:
--   a. Prefer the copy that has children. A childless twin carries no taxonomy.
--   b. Then prefer the copy that has a theme_id. A themeless root cannot appear under
--      any theme in the UI, so it is dead weight.
--   c. Then prefer the lower id, as the older row.
--   d. NEVER merge two copies that both have children AND different themes. Those are
--      genuinely distinct categories that happen to share a name.
--
-- Rule (d) deliberately spares two pairs:
--   * "Community"  626 (Meetup, 16 children: Neighborhood BBQ, Public Forum, ...)
--                  666 (Festival, 13 children: Carnival, County Fair, ...)
--   * "Personal"   16  (Health and Wellness, 8 children: Holistic, Tai Chi, ...)
--                  948 (Celebration, 13 children: Birthday, Graduation, ...)
-- Merging either would destroy real taxonomy. They are left exactly as they are.
--
-- That leaves 9 pairs where one copy is a themeless, childless, unreferenced root and
-- the other is a themed root. Verified read-only before writing: none of the 9 discardable
-- rows is referenced by public.events.type_id, and none has children.
--
-- No row referenced by an event is deleted or reparented anywhere in this migration.

BEGIN;

-- 1. Break the self-loop. 345 has 5 real children, so promote it to a root rather than
--    deleting it; that makes it and its subtree reachable again.
UPDATE public.event_types
SET parent_id = NULL
WHERE id = 345 AND parent_id = 345;

-- 2. Reattach rows whose parent no longer exists. Each still carries a valid theme_id,
--    so promoting them to theme roots restores them to the UI without inventing a parent.
UPDATE public.event_types e
SET parent_id = NULL
WHERE e.parent_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.event_types p WHERE p.id = e.parent_id);

-- 3. Drop the redundant twin in each pair, per the canonical-copy rule above.
--    The DELETE is expressed as the rule rather than as a hardcoded id list so it cannot
--    remove a row that has gained children, a theme or an event reference in the meantime.
DELETE FROM public.event_types loser
USING public.event_types keeper
WHERE loser.name = keeper.name
  AND loser.id <> keeper.id
  AND loser.parent_id IS NOT DISTINCT FROM keeper.parent_id
  -- (a) loser has no children, keeper is not disqualified
  AND NOT EXISTS (SELECT 1 FROM public.event_types k WHERE k.parent_id = loser.id)
  -- (b) loser has no theme, keeper does
  AND loser.theme_id IS NULL
  AND keeper.theme_id IS NOT NULL
  -- (d) never touch a row an event depends on
  AND NOT EXISTS (SELECT 1 FROM public.events ev WHERE ev.type_id = loser.id);

-- 4. Stop the damage recurring. A self-referencing parent is never valid, and a parent_id
--    must point at a real row. ON DELETE SET NULL keeps a deleted parent from stranding a
--    subtree the way it did here.
ALTER TABLE public.event_types
  DROP CONSTRAINT IF EXISTS event_types_parent_not_self;
ALTER TABLE public.event_types
  ADD CONSTRAINT event_types_parent_not_self CHECK (parent_id IS DISTINCT FROM id);

ALTER TABLE public.event_types
  DROP CONSTRAINT IF EXISTS event_types_parent_id_fkey;
ALTER TABLE public.event_types
  ADD CONSTRAINT event_types_parent_id_fkey
  FOREIGN KEY (parent_id) REFERENCES public.event_types(id) ON DELETE SET NULL;

COMMIT;

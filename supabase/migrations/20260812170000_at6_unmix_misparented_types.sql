-- Acceptance Test Results 08/12/2026 — remove types filed under the wrong parent.
--
-- Written against the live data, not from guesswork. Reading `public.event_types` showed:
--
--   Dining > Buffet            31 children, 16 of them Marketplace ARTISAN types
--                              (Jeweler, Blacksmith, Potter, Woodworker, ...)
--   Celebration > Engagement   5 children, all SPORTING types
--     Party                    (Basketball games, Car races, Dog shows, ...)
--   Health & Wellness >        holds Rejuvenation, Mindfulness and Wellness
--     Personal                 alongside the correct Rejuvenating
--
--   76 labels appear under more than one theme.
--   196 of 802 rows have theme_id = NULL and are invisible to the application,
--       because every loader filters on theme_id.
--
-- IMPORTANT — correcting an earlier mistake of mine:
-- 20260806120000 "fixed" misalignment with `UPDATE child SET theme_id = parent.theme_id`.
-- For a row sitting under the wrong parent that made the row consistently WRONG rather than
-- detectably wrong, which is why the integrity check now reports zero misalignment while the
-- menus still show foreign entries. Re-parenting has to be driven by what a row IS, not by
-- whatever it currently hangs from.
--
-- Idempotent and safe to re-run.

-- ---------------------------------------------------------------------------
-- 1) Remove intruders from the parents where they were observed.
--
--    A generic "same label under two themes, keep the bigger sibling group" rule
--    was tried and dry-run against the live snapshot first. It chose backwards:
--    Buffet has been polluted up to 31 children, so it looked "bigger" than the
--    16-strong Artisans branch the craft types actually belong to, and the rule
--    would have deleted them from their correct home. Explicit lists it is.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  doomed integer[];
BEGIN
  -- 1a) Dining > Buffet is holding Marketplace ARTISAN types.
  SELECT array_agg(child.id) INTO doomed
  FROM event_types child
  JOIN event_types parent ON parent.id = child.parent_id
  WHERE lower(btrim(parent.name)) = 'buffet'
    AND lower(btrim(child.name)) IN (
      'blacksmith', 'candle maker', 'carpenter', 'ceramic artist', 'fiber artist',
      'glassblower', 'jeweler', 'leather crafter', 'metalworker', 'painter',
      'potter', 'printmaker', 'sculptor', 'soap maker', 'textile artist', 'woodworker'
    );

  IF doomed IS NOT NULL THEN
    UPDATE events SET type_id = NULL WHERE type_id = ANY (doomed);
    UPDATE event_types SET parent_id = NULL WHERE parent_id = ANY (doomed);
    DELETE FROM event_types WHERE id = ANY (doomed);
    RAISE NOTICE 'Buffet: removed % artisan type(s)', array_length(doomed, 1);
  END IF;

  -- 1b) Celebration > Engagement Party is holding SPORTING types.
  SELECT array_agg(child.id) INTO doomed
  FROM event_types child
  JOIN event_types parent ON parent.id = child.parent_id
  WHERE lower(btrim(parent.name)) = 'engagement party'
    AND lower(btrim(child.name)) IN (
      'basketball games', 'tournaments', 'car races', 'dog shows', 'football games'
    );

  IF doomed IS NOT NULL THEN
    UPDATE events SET type_id = NULL WHERE type_id = ANY (doomed);
    DELETE FROM event_types WHERE id = ANY (doomed);
    RAISE NOTICE 'Engagement Party: removed % sporting type(s)', array_length(doomed, 1);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Explicit removals the client called out by name.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  hw_theme_id integer;
  doomed integer[];
BEGIN
  SELECT theme_id INTO hw_theme_id
  FROM event_types
  WHERE parent_id IS NULL
    AND theme_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM event_types c
      WHERE c.parent_id = event_types.id
        AND lower(btrim(c.name)) IN ('rejuvenating', 'holistic', 'spiritual', 'peaceful')
    )
  ORDER BY theme_id
  LIMIT 1;

  IF hw_theme_id IS NULL THEN
    RETURN;
  END IF;

  -- "remove type Rejuvenation; Rejuvenating is correct"
  -- "Remove mindfulness and wellness types (bottom of category)"
  SELECT array_agg(id) INTO doomed
  FROM event_types
  WHERE theme_id = hw_theme_id
    AND lower(btrim(name)) IN ('rejuvenation', 'mindfulness', 'wellness');

  IF doomed IS NOT NULL THEN
    UPDATE events SET type_id = NULL WHERE type_id = ANY (doomed);
    UPDATE event_types SET parent_id = NULL WHERE parent_id = ANY (doomed);
    DELETE FROM event_types WHERE id = ANY (doomed);
    RAISE NOTICE 'Removed % Health & Wellness row(s): Rejuvenation / Mindfulness / Wellness',
      array_length(doomed, 1);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3) Detached rows: 196 of 802 have theme_id = NULL and cannot be seen.
--
--    Children inherit from their root. Roots that match a category name already
--    owned by a theme are folded into that theme; anything still unattached is
--    left in place and reported, never guessed at.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  orphan RECORD;
  target_theme integer;
  attached integer := 0;
  leftover integer;
BEGIN
  -- 3a) Roots with no theme: adopt the theme of an identically named themed row.
  FOR orphan IN
    SELECT id, name FROM event_types WHERE theme_id IS NULL AND parent_id IS NULL
  LOOP
    SELECT theme_id INTO target_theme
    FROM event_types
    WHERE theme_id IS NOT NULL
      AND lower(btrim(name)) = lower(btrim(orphan.name))
    ORDER BY (SELECT count(*) FROM event_types c WHERE c.parent_id = event_types.id) DESC, id
    LIMIT 1;

    CONTINUE WHEN target_theme IS NULL;

    UPDATE event_types SET theme_id = target_theme WHERE id = orphan.id;
    attached := attached + 1;
  END LOOP;

  -- 3b) Children inherit whatever their ancestor now has (repeat for depth).
  FOR leftover IN 1..6 LOOP
    UPDATE event_types child
    SET theme_id = parent.theme_id
    FROM event_types parent
    WHERE child.parent_id = parent.id
      AND child.theme_id IS NULL
      AND parent.theme_id IS NOT NULL;
    EXIT WHEN NOT FOUND;
  END LOOP;

  SELECT count(*) INTO leftover FROM event_types WHERE theme_id IS NULL;
  RAISE NOTICE 'Attached % detached root(s); % row(s) still have no theme and need a decision',
    attached, leftover;
END $$;

-- ---------------------------------------------------------------------------
-- 4) Report what is still ambiguous rather than inventing an answer.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT name FROM event_types WHERE theme_id IS NULL ORDER BY name LIMIT 50
  LOOP
    RAISE NOTICE 'STILL UNASSIGNED: %', r.name;
  END LOOP;
END $$;

-- Acceptance Test 3 — Theme > Directory > category > type integrity.
--
-- Fixes reported in "M5_Task1 Acceptance Test 3 Results":
--   * "Create event > category > Has Double Entries"
--   * "Theme > create event > category > Has Missing Entries"
--   * "Misaligned directory > category > type (profiles) some profiles are linked to wrong Directory"
--   * "Special Events require Directory > category > type Profile Configuration for Menu selection"
--   * Dining / Festival Heritage / Sporting categories not reaching the browse menus
--
-- Everything here is idempotent and safe to re-run.

-- ---------------------------------------------------------------------------
-- 0) Normalise labels so comparisons and dedupe behave
-- ---------------------------------------------------------------------------
UPDATE event_types
SET name = btrim(regexp_replace(name, '\s+', ' ', 'g'))
WHERE name IS DISTINCT FROM btrim(regexp_replace(name, '\s+', ' ', 'g'));

-- ---------------------------------------------------------------------------
-- 1) Misaligned directories: a child must live in the same theme as its parent.
--
--    An earlier migration reparented every row named Contemporary / Buffet /
--    Fine Dining into the Dining theme regardless of which directory it
--    belonged to, which is how types ended up under the wrong Directory.
--    Walk the tree top-down a few times so deep branches settle too.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  pass integer;
  fixed integer;
BEGIN
  FOR pass IN 1..6 LOOP
    UPDATE event_types child
    SET theme_id = parent.theme_id
    FROM event_types parent
    WHERE child.parent_id = parent.id
      AND parent.theme_id IS NOT NULL
      AND child.theme_id IS DISTINCT FROM parent.theme_id;

    GET DIAGNOSTICS fixed = ROW_COUNT;
    EXIT WHEN fixed = 0;
    RAISE NOTICE 'Realigned % event_types row(s) to their parent theme (pass %)', fixed, pass;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Double entries: collapse rows that share theme + parent + label.
--
--    Keep the row with the most children (else the lowest id), move the other
--    rows' children and any `events.type_id` references onto it, then delete.
--    Children are repointed *before* the delete because event_types.parent_id
--    cascades on delete.
-- ---------------------------------------------------------------------------
-- Merging a duplicate parent can pull two identically named children under the
-- surviving row, so repeat until a pass finds nothing left to merge.
DO $$
DECLARE
  dup RECORD;
  keeper_id integer;
  pass integer;
  merged_this_pass integer;
BEGIN
  FOR pass IN 1..10 LOOP
    merged_this_pass := 0;

    FOR dup IN
      SELECT
        lower(btrim(name)) AS label,
        array_agg(id ORDER BY id) AS ids
      FROM event_types
      GROUP BY theme_id, parent_id, lower(btrim(name))
      HAVING count(*) > 1
    LOOP
      SELECT et.id INTO keeper_id
      FROM event_types et
      WHERE et.id = ANY (dup.ids)
      ORDER BY (SELECT count(*) FROM event_types c WHERE c.parent_id = et.id) DESC, et.id
      LIMIT 1;

      -- The cursor snapshot can still list a group an earlier iteration already merged.
      CONTINUE WHEN keeper_id IS NULL;

      -- Children move first: event_types.parent_id cascades on delete.
      UPDATE event_types
      SET parent_id = keeper_id
      WHERE parent_id = ANY (dup.ids)
        AND parent_id <> keeper_id;

      UPDATE events
      SET type_id = keeper_id
      WHERE type_id = ANY (dup.ids)
        AND type_id <> keeper_id;

      DELETE FROM event_types
      WHERE id = ANY (dup.ids)
        AND id <> keeper_id;

      merged_this_pass := merged_this_pass + 1;
      RAISE NOTICE 'Merged duplicate "%" into event_types id %', dup.label, keeper_id;
    END LOOP;

    EXIT WHEN merged_this_pass = 0;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3) Special Event: category names required by the client's menu configuration
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  special_theme_id integer;
BEGIN
  SELECT id INTO special_theme_id
  FROM "Themes Directory Catalog"
  WHERE lower(name) LIKE '%special%'
  ORDER BY id
  LIMIT 1;

  IF special_theme_id IS NULL THEN
    RETURN;
  END IF;

  -- 'Special Event/Charity' → 'Special Event/Convention'
  UPDATE event_types
  SET name = 'Convention'
  WHERE theme_id = special_theme_id
    AND lower(btrim(name)) IN ('charity', 'charity gala');

  -- 'Social Meetup' lives in the Meetupz theme; 'Heritage' lives in Festival.
  -- Clear the whole subtree from events first — deleting a category cascades to its types,
  -- and `events.type_id` would otherwise block the delete.
  WITH RECURSIVE doomed AS (
    SELECT id FROM event_types
    WHERE theme_id = special_theme_id
      AND lower(btrim(name)) IN ('social meetup', 'social meet-up', 'social meet up', 'heritage')
    UNION ALL
    SELECT child.id
    FROM event_types child
    JOIN doomed ON child.parent_id = doomed.id
  )
  UPDATE events SET type_id = NULL WHERE type_id IN (SELECT id FROM doomed);

  DELETE FROM event_types
  WHERE theme_id = special_theme_id
    AND lower(btrim(name)) IN ('social meetup', 'social meet-up', 'social meet up', 'heritage');

  UPDATE "Themes Directory Catalog"
  SET tags = ARRAY(
    SELECT t FROM unnest(COALESCE(tags, ARRAY[]::text[])) AS t
    WHERE lower(btrim(t)) NOT IN ('social meetup', 'social meet-up', 'social meet up', 'heritage', 'charity', 'charity gala')
  )
  WHERE id = special_theme_id;
END $$;

-- ---------------------------------------------------------------------------
-- 4) Sporting: 5K race + Game Night categories under the theme's format root
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  sporting_theme_id integer;
  formats_root_id integer;
  cat_name text;
BEGIN
  SELECT id INTO sporting_theme_id
  FROM "Themes Directory Catalog"
  WHERE lower(btrim(name)) IN ('sporting', 'sport', 'sports')
  ORDER BY CASE lower(btrim(name)) WHEN 'sporting' THEN 0 WHEN 'sport' THEN 1 ELSE 2 END, id
  LIMIT 1;

  IF sporting_theme_id IS NULL THEN
    RETURN;
  END IF;

  SELECT id INTO formats_root_id
  FROM event_types
  WHERE theme_id = sporting_theme_id
    AND parent_id IS NULL
    AND lower(btrim(name)) = 'event formats'
  ORDER BY id
  LIMIT 1;

  IF formats_root_id IS NULL THEN
    SELECT id INTO formats_root_id
    FROM event_types
    WHERE theme_id = sporting_theme_id AND parent_id IS NULL
    ORDER BY id
    LIMIT 1;
  END IF;

  IF formats_root_id IS NULL THEN
    INSERT INTO event_types (name, theme_id, parent_id)
    VALUES ('Event formats', sporting_theme_id, NULL)
    RETURNING id INTO formats_root_id;
  END IF;

  FOREACH cat_name IN ARRAY ARRAY['5K race', 'Game Night']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM event_types
      WHERE theme_id = sporting_theme_id
        AND parent_id = formats_root_id
        AND lower(btrim(name)) = lower(cat_name)
    ) THEN
      INSERT INTO event_types (name, theme_id, parent_id)
      VALUES (cat_name, sporting_theme_id, formats_root_id);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 5) Rebuild `Themes Directory Catalog.tags` from the real category rows.
--
--    Browse Event Themes renders one badge per category. The badges used to be
--    driven by this legacy column, so categories added to `event_types` (Dining
--    Contemporary/Buffet/Fine Dining, Festival Heritage, Sporting formats) never
--    appeared. The UI now reads `event_types` directly; this keeps the column
--    honest for anything still consuming it.
--
--    Category derivation mirrors the app: a theme whose only top-level row is a
--    wrapper (its children have children of their own) exposes that wrapper's
--    children as the categories.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  theme RECORD;
  root_count integer;
  root_id integer;
  grandchild_count integer;
  category_names text[];
BEGIN
  FOR theme IN SELECT id, name FROM "Themes Directory Catalog" ORDER BY id LOOP
    SELECT count(*) INTO root_count
    FROM event_types
    WHERE theme_id = theme.id AND parent_id IS NULL;

    IF root_count = 0 THEN
      CONTINUE;
    END IF;

    category_names := NULL;

    IF root_count = 1 THEN
      SELECT id INTO root_id
      FROM event_types
      WHERE theme_id = theme.id AND parent_id IS NULL
      LIMIT 1;

      SELECT count(*) INTO grandchild_count
      FROM event_types g
      WHERE g.parent_id IN (SELECT id FROM event_types WHERE parent_id = root_id);

      IF grandchild_count > 0 THEN
        SELECT array_agg(name ORDER BY name) INTO category_names
        FROM event_types
        WHERE parent_id = root_id;
      END IF;
    END IF;

    IF category_names IS NULL THEN
      SELECT array_agg(name ORDER BY name) INTO category_names
      FROM event_types
      WHERE theme_id = theme.id AND parent_id IS NULL;
    END IF;

    IF category_names IS NULL OR array_length(category_names, 1) IS NULL THEN
      CONTINUE;
    END IF;

    -- Never label a category with the theme's own name (e.g. Sporting > "Sport").
    SELECT array_agg(t ORDER BY t) INTO category_names
    FROM unnest(category_names) AS t
    WHERE lower(btrim(t)) <> lower(btrim(theme.name))
      AND NOT (
        lower(btrim(theme.name)) IN ('sporting', 'sport', 'sports')
        AND lower(btrim(t)) IN ('sporting', 'sport', 'sports')
      );

    IF category_names IS NULL OR array_length(category_names, 1) IS NULL THEN
      CONTINUE;
    END IF;

    UPDATE "Themes Directory Catalog"
    SET tags = category_names
    WHERE id = theme.id;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 6) Guard rail: stop duplicate categories from being seeded again.
--
--    Wrapped so an unexpected leftover duplicate reports a warning instead of
--    rolling back the data repairs above.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS event_types_unique_label_per_parent
    ON event_types (theme_id, parent_id, lower(btrim(name)))
    WHERE parent_id IS NOT NULL;
EXCEPTION WHEN unique_violation THEN
  RAISE WARNING 'event_types still has duplicate child labels; index not created';
END $$;

DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS event_types_unique_root_label_per_theme
    ON event_types (theme_id, lower(btrim(name)))
    WHERE parent_id IS NULL;
EXCEPTION WHEN unique_violation THEN
  RAISE WARNING 'event_types still has duplicate root labels; index not created';
END $$;

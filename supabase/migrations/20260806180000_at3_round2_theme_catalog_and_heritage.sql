-- Acceptance Testing 08/06/2026 — second round of Theme > Directory > category > type fixes.
--
--   * "Sidebar 'Create Event' > Event Theme selection menu contains double entries for 'Dining'"
--   * "Dining > category ... currently has more than 1 table type entries"
--   * "Add Festival > category 'Heritage' > types ... Table should contain ethnic groups"
--   * "Celebration two categories 'Holiday and Personal' ... each category should contain types"
--   * "Health and Wellness > type (missing dropdown menu selection)"
--
-- Idempotent and safe to re-run.

-- ---------------------------------------------------------------------------
-- 1) Duplicate theme rows in "Themes Directory Catalog"
--
--    The Dining alignment migration reparented event_types onto a canonical
--    Dining row but never removed the duplicate catalog row, so the Create
--    Event theme dropdown listed "Dining" twice and its category dropdown
--    merged types from both rows.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  dup RECORD;
  keeper_id integer;
BEGIN
  FOR dup IN
    SELECT lower(btrim(name)) AS label, array_agg(id ORDER BY id) AS ids
    FROM "Themes Directory Catalog"
    GROUP BY lower(btrim(name))
    HAVING count(*) > 1
  LOOP
    -- Prefer the row that already owns the most event_types.
    SELECT t.id INTO keeper_id
    FROM "Themes Directory Catalog" t
    WHERE t.id = ANY (dup.ids)
    ORDER BY (SELECT count(*) FROM event_types et WHERE et.theme_id = t.id) DESC, t.id
    LIMIT 1;

    CONTINUE WHEN keeper_id IS NULL;

    UPDATE event_types SET theme_id = keeper_id
    WHERE theme_id = ANY (dup.ids) AND theme_id <> keeper_id;

    BEGIN
      UPDATE events SET theme_id = keeper_id
      WHERE theme_id = ANY (dup.ids) AND theme_id <> keeper_id;
    EXCEPTION WHEN undefined_column THEN
      NULL;
    END;

    -- Fold any tags recorded only on the duplicates into the survivor.
    UPDATE "Themes Directory Catalog" k
    SET tags = ARRAY(
      SELECT DISTINCT t FROM unnest(
        COALESCE(k.tags, ARRAY[]::text[]) ||
        COALESCE((
          SELECT array_agg(x)
          FROM "Themes Directory Catalog" d, unnest(COALESCE(d.tags, ARRAY[]::text[])) AS x
          WHERE d.id = ANY (dup.ids) AND d.id <> keeper_id
        ), ARRAY[]::text[])
      ) AS t
      WHERE btrim(t) <> ''
    )
    WHERE k.id = keeper_id;

    DELETE FROM "Themes Directory Catalog"
    WHERE id = ANY (dup.ids) AND id <> keeper_id;

    RAISE NOTICE 'Merged duplicate theme "%" into catalog id %', dup.label, keeper_id;
  END LOOP;
END $$;

-- Re-run the child/parent theme alignment now that themes have been merged.
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
  END LOOP;
END $$;

-- Collapse duplicate category/type labels created by the theme merge.
DO $$
DECLARE
  dup RECORD;
  keeper_id integer;
  pass integer;
  merged integer;
BEGIN
  FOR pass IN 1..10 LOOP
    merged := 0;
    FOR dup IN
      SELECT lower(btrim(name)) AS label, array_agg(id ORDER BY id) AS ids
      FROM event_types
      GROUP BY theme_id, parent_id, lower(btrim(name))
      HAVING count(*) > 1
    LOOP
      SELECT et.id INTO keeper_id
      FROM event_types et
      WHERE et.id = ANY (dup.ids)
      ORDER BY (SELECT count(*) FROM event_types c WHERE c.parent_id = et.id) DESC, et.id
      LIMIT 1;

      CONTINUE WHEN keeper_id IS NULL;

      UPDATE event_types SET parent_id = keeper_id
      WHERE parent_id = ANY (dup.ids) AND parent_id <> keeper_id;
      UPDATE events SET type_id = keeper_id
      WHERE type_id = ANY (dup.ids) AND type_id <> keeper_id;
      DELETE FROM event_types WHERE id = ANY (dup.ids) AND id <> keeper_id;

      merged := merged + 1;
    END LOOP;
    EXIT WHEN merged = 0;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Festival > Heritage > types must be ethnic groups
--
--    The category previously held descriptive labels (Cultural Heritage,
--    Family Heritage, ...). The client asked for ethnic groups instead.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  festival_theme_id integer;
  heritage_id integer;
  legacy_ids integer[];
  group_name text;
BEGIN
  SELECT id INTO festival_theme_id
  FROM "Themes Directory Catalog"
  WHERE lower(btrim(name)) LIKE 'festival%'
  ORDER BY id
  LIMIT 1;

  IF festival_theme_id IS NULL THEN
    RETURN;
  END IF;

  SELECT id INTO heritage_id
  FROM event_types
  WHERE theme_id = festival_theme_id AND lower(btrim(name)) = 'heritage'
  ORDER BY (parent_id IS NULL) DESC, id
  LIMIT 1;

  IF heritage_id IS NULL THEN
    INSERT INTO event_types (name, parent_id, theme_id)
    VALUES ('Heritage', NULL, festival_theme_id)
    RETURNING id INTO heritage_id;
  END IF;

  FOREACH group_name IN ARRAY ARRAY[
    'African American',
    'Asian American',
    'Caribbean American',
    'Chinese American',
    'Filipino American',
    'German American',
    'Greek American',
    'Indian American',
    'Irish American',
    'Italian American',
    'Japanese American',
    'Jewish American',
    'Korean American',
    'Mexican American',
    'Native American',
    'Nigerian American',
    'Polish American',
    'Puerto Rican American',
    'Scottish American',
    'Vietnamese American'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM event_types
      WHERE parent_id = heritage_id AND lower(btrim(name)) = lower(group_name)
    ) THEN
      INSERT INTO event_types (name, parent_id, theme_id)
      VALUES (group_name, heritage_id, festival_theme_id);
    END IF;
  END LOOP;

  -- Retire the old descriptive labels, detaching any events that referenced them.
  SELECT array_agg(id) INTO legacy_ids
  FROM event_types
  WHERE parent_id = heritage_id
    AND lower(btrim(name)) IN (
      'cultural heritage', 'family heritage', 'community heritage',
      'historical heritage', 'ethnic heritage'
    );

  IF legacy_ids IS NOT NULL THEN
    UPDATE events SET type_id = heritage_id WHERE type_id = ANY (legacy_ids);
    DELETE FROM event_types WHERE id = ANY (legacy_ids);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3) Every category must offer at least one selectable type.
--
--    Browse Event Themes renders a category badge with a dropdown of its child
--    types. A category with no children showed an empty menu, which is what
--    "Health and Wellness > type (missing dropdown menu selection)" and the
--    Celebration Holiday/Personal note describe. Give any such category a
--    child carrying its own name so the menu is always selectable.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  cat RECORD;
  created integer := 0;
BEGIN
  FOR cat IN
    SELECT c.id, c.name, c.theme_id
    FROM event_types c
    JOIN event_types root ON root.id = c.parent_id
    WHERE root.parent_id IS NULL
      AND c.theme_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM event_types g WHERE g.parent_id = c.id)
      -- Only for themes that use a category → type tree, so we do not turn a
      -- leaf-only theme into an artificial extra level.
      AND EXISTS (
        SELECT 1
        FROM event_types sibling
        JOIN event_types grandchild ON grandchild.parent_id = sibling.id
        WHERE sibling.parent_id = root.id
      )
  LOOP
    INSERT INTO event_types (name, parent_id, theme_id)
    VALUES (cat.name, cat.id, cat.theme_id);
    created := created + 1;
  END LOOP;

  IF created > 0 THEN
    RAISE NOTICE 'Added % placeholder type row(s) so every category has a dropdown entry', created;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4) Refresh the legacy tags column from the real category rows.
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
    FROM event_types WHERE theme_id = theme.id AND parent_id IS NULL;

    CONTINUE WHEN root_count = 0;
    category_names := NULL;

    IF root_count = 1 THEN
      SELECT id INTO root_id
      FROM event_types WHERE theme_id = theme.id AND parent_id IS NULL LIMIT 1;

      SELECT count(*) INTO grandchild_count
      FROM event_types g
      WHERE g.parent_id IN (SELECT id FROM event_types WHERE parent_id = root_id);

      IF grandchild_count > 0 THEN
        SELECT array_agg(name ORDER BY name) INTO category_names
        FROM event_types WHERE parent_id = root_id;
      END IF;
    END IF;

    IF category_names IS NULL THEN
      SELECT array_agg(name ORDER BY name) INTO category_names
      FROM event_types WHERE theme_id = theme.id AND parent_id IS NULL;
    END IF;

    CONTINUE WHEN category_names IS NULL OR array_length(category_names, 1) IS NULL;

    SELECT array_agg(t ORDER BY t) INTO category_names
    FROM unnest(category_names) AS t
    WHERE lower(btrim(t)) <> lower(btrim(theme.name))
      AND NOT (
        lower(btrim(theme.name)) IN ('sporting', 'sport', 'sports')
        AND lower(btrim(t)) IN ('sporting', 'sport', 'sports')
      );

    CONTINUE WHEN category_names IS NULL OR array_length(category_names, 1) IS NULL;

    UPDATE "Themes Directory Catalog" SET tags = category_names WHERE id = theme.id;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 5) Guard rail against re-introducing duplicate theme rows.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS themes_directory_catalog_unique_name
    ON "Themes Directory Catalog" (lower(btrim(name)));
EXCEPTION WHEN unique_violation THEN
  RAISE WARNING 'Themes Directory Catalog still has duplicate names; index not created';
END $$;

-- Task 1 / M5 follow-up (updated PDF):
-- 1) Sporting categories: 5K race, Game Night
-- 2) Remove Special Event / Heritage (Festival Heritage stays)

-- ---------------------------------------------------------------------------
-- 1) Sporting: add 5K race + Game Night under Event formats root
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  sporting_theme_id integer;
  formats_root_id integer;
  cat_name text;
BEGIN
  SELECT id INTO sporting_theme_id
  FROM "Themes Directory Catalog"
  WHERE lower(trim(name)) IN ('sporting', 'sport', 'sports')
  ORDER BY
    CASE lower(trim(name))
      WHEN 'sporting' THEN 0
      WHEN 'sport' THEN 1
      ELSE 2
    END,
    id
  LIMIT 1;

  IF sporting_theme_id IS NULL THEN
    RETURN;
  END IF;

  SELECT id INTO formats_root_id
  FROM event_types
  WHERE theme_id = sporting_theme_id
    AND parent_id IS NULL
    AND lower(trim(name)) = 'event formats'
  ORDER BY id
  LIMIT 1;

  IF formats_root_id IS NULL THEN
    SELECT id INTO formats_root_id
    FROM event_types
    WHERE theme_id = sporting_theme_id
      AND parent_id IS NULL
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
        AND lower(trim(name)) = lower(cat_name)
    ) THEN
      INSERT INTO event_types (name, theme_id, parent_id)
      VALUES (cat_name, sporting_theme_id, formats_root_id);
    END IF;
  END LOOP;

  -- Keep catalog tags discoverable in browse UI when tags drive badges
  UPDATE "Themes Directory Catalog"
  SET tags = (
    SELECT ARRAY(
      SELECT DISTINCT t
      FROM unnest(
        COALESCE(tags, ARRAY[]::text[]) || ARRAY['5K race', 'Game Night']
      ) AS t
    )
  )
  WHERE id = sporting_theme_id;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Special Event: remove Heritage category + children (not Festival)
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

  -- Children under Special Event Heritage categories first
  DELETE FROM event_types
  WHERE theme_id = special_theme_id
    AND parent_id IN (
      SELECT id FROM event_types
      WHERE theme_id = special_theme_id
        AND lower(trim(name)) = 'heritage'
    );

  -- Heritage category / leaf rows under Special Event
  DELETE FROM event_types
  WHERE theme_id = special_theme_id
    AND lower(trim(name)) = 'heritage';

  UPDATE "Themes Directory Catalog"
  SET tags = ARRAY(
    SELECT t FROM unnest(COALESCE(tags, ARRAY[]::text[])) AS t
    WHERE lower(trim(t)) <> 'heritage'
  )
  WHERE id = special_theme_id;
END $$;

DO $$
BEGIN
  UPDATE "Themes Directory"
  SET special_event = array_remove(special_event, 'Heritage')
  WHERE special_event IS NOT NULL AND 'Heritage' = ANY (special_event);
EXCEPTION WHEN undefined_column OR undefined_table OR datatype_mismatch THEN
  NULL;
END $$;

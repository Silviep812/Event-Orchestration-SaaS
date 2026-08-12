-- Acceptance Testing 08/06/2026 — give every reported category a real type list.
--
--   * "Health and Wellness > type (missing dropdown menu selection)"
--   * "Celebration two categories 'Holiday and Personal' clarified: each category should
--      contain types as a dropdown menu selection"
--   * "Dining > category (contemporary, buffet and fine dining) with drop down menu selection"
--
-- The previous migration guaranteed no category showed an empty menu by giving a childless
-- category a single child carrying its own name (e.g. "Mindful > Mindful"). That satisfies the
-- letter of the requirement but is not a usable menu. This migration replaces those placeholders
-- with real types.
--
-- Deliberately conservative: a category that already has genuine types is left untouched. Only
-- categories that are empty, or hold nothing but the self-named placeholder, are seeded.
--
-- Idempotent and safe to re-run.

-- ---------------------------------------------------------------------------
-- Seed data: theme name pattern → category → types
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS _iep_category_type_seed;
CREATE TEMP TABLE _iep_category_type_seed (
  theme_pattern text NOT NULL,
  category_name text NOT NULL,
  type_name     text NOT NULL
);

-- Category labels vary in the data between singular and plural ("Holiday" vs "Holidays"), so all
-- comparisons below normalise a trailing "s" away on both sides.
CREATE OR REPLACE FUNCTION pg_temp._iep_cat_key(label text)
RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT regexp_replace(lower(btrim(coalesce(label, ''))), 's$', '')
$fn$;

INSERT INTO _iep_category_type_seed (theme_pattern, category_name, type_name) VALUES
  -- Celebration > Holiday — Themes Directory Catalog.holiday_types
  ('celebration', 'Holiday', 'New Years Day'),
  ('celebration', 'Holiday', 'MLK Day'),
  ('celebration', 'Holiday', 'Presidents Day'),
  ('celebration', 'Holiday', 'Memorial Day'),
  ('celebration', 'Holiday', 'Independence Day'),
  ('celebration', 'Holiday', 'Labor Day'),
  ('celebration', 'Holiday', 'Columbus Day'),
  ('celebration', 'Holiday', 'Veterans Day'),
  ('celebration', 'Holiday', 'Thanksgiving'),
  ('celebration', 'Holiday', 'Christmas'),

  -- Celebration > Personal — Themes Directory Catalog.personal_types
  ('celebration', 'Personal', 'Baby Shower'),
  ('celebration', 'Personal', 'Birthday Party'),
  ('celebration', 'Personal', 'Anniversary'),
  ('celebration', 'Personal', 'Graduation');

-- ---------------------------------------------------------------------------
-- Apply: seed only categories that are empty or hold just the placeholder
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  cat RECORD;
  placeholder_ids integer[];
  seeded integer := 0;
BEGIN
  FOR cat IN
    SELECT DISTINCT c.id, c.name AS category_name, c.theme_id, s.theme_pattern
    FROM _iep_category_type_seed s
    JOIN "Themes Directory Catalog" th
      ON lower(btrim(th.name)) LIKE '%' || s.theme_pattern || '%'
    JOIN event_types c
      ON c.theme_id = th.id
     AND pg_temp._iep_cat_key(c.name) = pg_temp._iep_cat_key(s.category_name)
  LOOP
    -- A category counts as "needs seeding" when its only child repeats its own name.
    SELECT array_agg(g.id) INTO placeholder_ids
    FROM event_types g
    WHERE g.parent_id = cat.id
      AND pg_temp._iep_cat_key(g.name) = pg_temp._iep_cat_key(cat.category_name);

    CONTINUE WHEN EXISTS (
      SELECT 1 FROM event_types g
      WHERE g.parent_id = cat.id
        AND pg_temp._iep_cat_key(g.name) <> pg_temp._iep_cat_key(cat.category_name)
    );

    INSERT INTO event_types (name, parent_id, theme_id)
    SELECT s.type_name, cat.id, cat.theme_id
    FROM _iep_category_type_seed s
    WHERE s.theme_pattern = cat.theme_pattern
      AND pg_temp._iep_cat_key(s.category_name) = pg_temp._iep_cat_key(cat.category_name)
      AND NOT EXISTS (
        SELECT 1 FROM event_types existing
        WHERE existing.parent_id = cat.id
          AND lower(btrim(existing.name)) = lower(btrim(s.type_name))
      );

    -- Retire the placeholder now that real types exist, moving any events onto the category.
    IF placeholder_ids IS NOT NULL THEN
      UPDATE events SET type_id = cat.id WHERE type_id = ANY (placeholder_ids);
      DELETE FROM event_types WHERE id = ANY (placeholder_ids);
    END IF;

    seeded := seeded + 1;
    RAISE NOTICE 'Seeded types for % > %', cat.theme_pattern, cat.category_name;
  END LOOP;

  RAISE NOTICE 'Seeded % category type list(s)', seeded;
END $$;

DROP TABLE IF EXISTS _iep_category_type_seed;

-- ---------------------------------------------------------------------------
-- Safety net: any category still empty keeps a selectable entry so no menu is
-- blank. Categories seeded above no longer hit this path.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  cat RECORD;
BEGIN
  FOR cat IN
    SELECT c.id, c.name, c.theme_id
    FROM event_types c
    JOIN event_types root ON root.id = c.parent_id
    WHERE root.parent_id IS NULL
      AND c.theme_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM event_types g WHERE g.parent_id = c.id)
      AND EXISTS (
        SELECT 1
        FROM event_types sibling
        JOIN event_types grandchild ON grandchild.parent_id = sibling.id
        WHERE sibling.parent_id = root.id
      )
  LOOP
    INSERT INTO event_types (name, parent_id, theme_id)
    VALUES (cat.name, cat.id, cat.theme_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

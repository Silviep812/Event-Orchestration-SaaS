-- Acceptance Test Results 08/08/2026, per IEP_Current_System_Schema2.
--
--   "New Table: Theme Directory - attributes 4 thru 15 arrays needs to be joined with
--    New Table: Themes Directory Catalog > category > type > sub-types Array"
--
-- `Themes Directory Catalog` already carries the hierarchy in its array columns, but nothing ever
-- projected them into `event_types`, which is what the application reads:
--
--   celebration_types = {holiday, personal}                    → categories under Celebration
--     holiday_types   = {New Years Day, MLK Day, ...}          → types under Holiday
--     personal_types  = {baby_shower, birthday_party, ...}     → types under Personal
--   wedding_types     = {bridal_shower, ceremony, ...}         → categories under Wedding
--   retreat_types     = {skills_building, ...}                 → categories under Retreats
--
-- dining_types, festival_types, reunion_types and health_wellness_types are empty in the schema
-- printout, so those themes are left exactly as they are — this migration never invents content.
--
-- Idempotent and safe to re-run.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Array values are stored snake_case ('baby_shower'); menus need 'Baby Shower'.
CREATE OR REPLACE FUNCTION pg_temp._iep_label(raw text)
RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT btrim(regexp_replace(initcap(replace(coalesce(raw, ''), '_', ' ')), '\s+', ' ', 'g'))
$fn$;

-- Case/plural-insensitive comparison key.
CREATE OR REPLACE FUNCTION pg_temp._iep_key(raw text)
RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT regexp_replace(lower(btrim(replace(coalesce(raw, ''), '_', ' '))), 's$', '')
$fn$;

/**
 * Ensure one row exists under `p_parent` (NULL = theme root level) and return its id.
 */
CREATE OR REPLACE FUNCTION pg_temp._iep_upsert_type(
  p_theme_id integer,
  p_parent_id integer,
  p_label text
) RETURNS integer LANGUAGE plpgsql AS $fn$
DECLARE
  existing_id integer;
BEGIN
  IF p_label IS NULL OR btrim(p_label) = '' THEN
    RETURN NULL;
  END IF;

  SELECT id INTO existing_id
  FROM event_types
  WHERE theme_id = p_theme_id
    AND parent_id IS NOT DISTINCT FROM p_parent_id
    AND pg_temp._iep_key(name) = pg_temp._iep_key(p_label)
  ORDER BY id
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    RETURN existing_id;
  END IF;

  INSERT INTO event_types (name, parent_id, theme_id)
  VALUES (btrim(p_label), p_parent_id, p_theme_id)
  RETURNING id INTO existing_id;

  RETURN existing_id;
END $fn$;

-- ---------------------------------------------------------------------------
-- Project the catalog arrays into event_types
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  mapping RECORD;
  theme RECORD;
  root_id integer;
  category_id integer;
  category_label text;
  category_values text[];
  type_values text[];
  type_label text;
  sub_column text;
  categories_added integer := 0;
  types_added integer := 0;
BEGIN
  -- catalog column holding the CATEGORY list  →  theme name pattern
  FOR mapping IN
    SELECT * FROM (VALUES
      ('celebration_types',      'celebration'),
      ('wedding_types',          'wedding'),
      ('retreat_types',          'retreat'),
      ('dining_types',           'dining'),
      ('festival_types',         'festival'),
      ('reunion_types',          'reunion'),
      ('health_wellness_types',  'health')
    ) AS t(category_column, theme_pattern)
  LOOP
    FOR theme IN
      SELECT id, name FROM "Themes Directory Catalog"
      WHERE lower(btrim(name)) LIKE '%' || mapping.theme_pattern || '%'
      ORDER BY id
    LOOP
      -- Read the category array for THIS theme row.
      BEGIN
        EXECUTE format(
          'SELECT %I FROM "Themes Directory Catalog" WHERE id = $1',
          mapping.category_column
        ) INTO category_values USING theme.id;
      EXCEPTION WHEN undefined_column THEN
        CONTINUE;
      END;

      CONTINUE WHEN category_values IS NULL OR array_length(category_values, 1) IS NULL;

      -- Attach beneath the theme's single wrapper root when it has one.
      SELECT id INTO root_id
      FROM event_types
      WHERE theme_id = theme.id AND parent_id IS NULL
      ORDER BY id
      LIMIT 1;

      IF (SELECT count(*) FROM event_types WHERE theme_id = theme.id AND parent_id IS NULL) <> 1 THEN
        root_id := NULL;
      END IF;

      FOREACH category_label IN ARRAY category_values
      LOOP
        CONTINUE WHEN btrim(coalesce(category_label, '')) = '';

        category_id := pg_temp._iep_upsert_type(
          theme.id, root_id, pg_temp._iep_label(category_label)
        );
        CONTINUE WHEN category_id IS NULL;
        categories_added := categories_added + 1;

        -- A category may itself have a "<category>_types" column holding its types
        -- (holiday_types, personal_types). Absent column simply means no deeper level.
        sub_column := regexp_replace(lower(btrim(category_label)), '[^a-z0-9]+', '_', 'g') || '_types';
        type_values := NULL;
        BEGIN
          EXECUTE format(
            'SELECT %I FROM "Themes Directory Catalog" WHERE id = $1',
            sub_column
          ) INTO type_values USING theme.id;
        EXCEPTION WHEN undefined_column THEN
          type_values := NULL;
        END;

        CONTINUE WHEN type_values IS NULL OR array_length(type_values, 1) IS NULL;

        FOREACH type_label IN ARRAY type_values
        LOOP
          CONTINUE WHEN btrim(coalesce(type_label, '')) = '';
          PERFORM pg_temp._iep_upsert_type(
            theme.id, category_id, pg_temp._iep_label(type_label)
          );
          types_added := types_added + 1;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Catalog arrays projected: % category slot(s), % type slot(s)', categories_added, types_added;
END $$;

-- ---------------------------------------------------------------------------
-- Refresh the tags column so browse badges match the projected categories.
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
    WHERE lower(btrim(t)) <> lower(btrim(theme.name));

    CONTINUE WHEN category_names IS NULL OR array_length(category_names, 1) IS NULL;

    UPDATE "Themes Directory Catalog" SET tags = category_names WHERE id = theme.id;
  END LOOP;
END $$;

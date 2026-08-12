-- Acceptance Test Results 08/08/2026
--
--   * "Location directory search contains only MD. Should contain DC and VA also."
--   * "New Table: Theme Directory - attributes 4 thru 15 arrays needs to be joined with
--      New Table: Themes Directory Catalog > category > type > sub-types Array"
--
-- Idempotent and safe to re-run.

-- ---------------------------------------------------------------------------
-- 1) DC and Virginia venues
--
--    The location filter offers the locations actually recorded in the
--    directory, so a Maryland-only dataset produced a Maryland-only filter.
--    Seed the rest of the DMV so DC and VA appear.
-- ---------------------------------------------------------------------------
WITH vt AS (
  SELECT COALESCE(
    (SELECT id FROM public.venue_types WHERE name = 'Hospitality Location' ORDER BY id LIMIT 1),
    (SELECT id FROM public.venue_types WHERE name = 'Other' ORDER BY id LIMIT 1),
    (SELECT id FROM public.venue_types ORDER BY id LIMIT 1)
  ) AS type_id
)
INSERT INTO public.venues (business_name, city, state, zip, venue_type_id, capacity)
SELECT v.business_name, v.city, v.state, v.zip, vt.type_id, v.capacity
FROM vt,
(VALUES
  -- District of Columbia -----------------------------------------------------
  ('The Meridian Ballroom',        'Washington',   'DC', '20009', 300),
  ('Capitol View Conference Centre','Washington',  'DC', '20003', 220),
  ('Georgetown Waterfront Hall',   'Washington',   'DC', '20007', 180),
  ('Dupont Circle Event Space',    'Washington',   'DC', '20036', 120),
  ('Navy Yard Pavilion',           'Washington',   'DC', '20003', 400),
  ('Union Market Loft',            'Washington',   'DC', '20002', 150),
  -- Virginia -----------------------------------------------------------------
  ('Old Town Alexandria Manor',    'Alexandria',   'VA', '22314', 250),
  ('Arlington Skyline Terrace',    'Arlington',    'VA', '22201', 200),
  ('Tysons Corner Grand Hall',     'McLean',       'VA', '22102', 500),
  ('Reston Lakeside Pavilion',     'Reston',       'VA', '20190', 175),
  ('Richmond Riverfront Venue',    'Richmond',     'VA', '23219', 320),
  ('Virginia Beach Oceanfront Hall','Virginia Beach','VA','23451', 280),
  ('Charlottesville Vineyard Barn','Charlottesville','VA','22902', 140),
  ('Fairfax Historic Courthouse Hall','Fairfax',   'VA', '22030', 160)
) AS v(business_name, city, state, zip, capacity)
WHERE NOT EXISTS (
  SELECT 1 FROM public.venues existing
  WHERE lower(btrim(existing.business_name)) = lower(btrim(v.business_name))
);

-- ---------------------------------------------------------------------------
-- 2) Fold the legacy "Themes Directory" array columns into the catalog tree
--
--    "Themes Directory" holds one column per theme, several of them text[] of
--    category labels (market_place, meet_up, parties, special_event, sporting
--    and the single-value columns beside them). Those arrays were never joined
--    to "Themes Directory Catalog", so labels recorded there never appeared as
--    categories under the matching theme. Copy anything missing across as a
--    category row; existing categories and their types are left untouched.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  col RECORD;
  theme_id_v integer;
  root_id integer;
  label text;
  labels text[];
  added integer := 0;
BEGIN
  -- column name in "Themes Directory" → theme name pattern in the catalog
  FOR col IN
    SELECT * FROM (VALUES
      ('wedding',          'wedding'),
      ('parties',          'celebration'),
      ('special_event',    'special'),
      ('bridal_shower',    'bridal'),
      ('baby_shower',      'baby'),
      ('reunion',          'reunion'),
      ('meet_up',          'meet'),
      ('sporting',         'sport'),
      ('Festival',         'festival'),
      ('market_place',     'market'),
      ('Dining',           'dining'),
      ('retreats',         'retreat'),
      ('Celebration',      'celebration'),
      ('Health_Wellness',  'health')
    ) AS t(column_name, theme_pattern)
  LOOP
    SELECT id INTO theme_id_v
    FROM "Themes Directory Catalog"
    WHERE lower(btrim(name)) LIKE '%' || col.theme_pattern || '%'
    ORDER BY id
    LIMIT 1;

    CONTINUE WHEN theme_id_v IS NULL;

    -- Read the column dynamically; it may be text or text[], and may not exist.
    BEGIN
      EXECUTE format(
        'SELECT array_agg(DISTINCT x) FROM "Themes Directory" td,
           LATERAL (
             SELECT CASE
               WHEN pg_typeof(td.%1$I)::text = ''text[]'' THEN td.%1$I
               ELSE ARRAY[td.%1$I::text]
             END AS arr
           ) a,
           LATERAL unnest(a.arr) AS x
         WHERE x IS NOT NULL AND btrim(x) <> ''''',
        col.column_name
      ) INTO labels;
    EXCEPTION WHEN undefined_column OR undefined_table OR datatype_mismatch OR invalid_text_representation THEN
      CONTINUE;
    END;

    CONTINUE WHEN labels IS NULL OR array_length(labels, 1) IS NULL;

    -- Attach under the theme's single root when it has one, else at top level.
    SELECT id INTO root_id
    FROM event_types
    WHERE theme_id = theme_id_v AND parent_id IS NULL
    ORDER BY id
    LIMIT 1;

    IF (SELECT count(*) FROM event_types WHERE theme_id = theme_id_v AND parent_id IS NULL) <> 1 THEN
      root_id := NULL;
    END IF;

    FOREACH label IN ARRAY labels
    LOOP
      CONTINUE WHEN btrim(label) = '';
      -- Skip when the label already exists anywhere in this theme.
      CONTINUE WHEN EXISTS (
        SELECT 1 FROM event_types
        WHERE theme_id = theme_id_v AND lower(btrim(name)) = lower(btrim(label))
      );

      INSERT INTO event_types (name, parent_id, theme_id)
      VALUES (btrim(label), root_id, theme_id_v);
      added := added + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Joined % legacy Themes Directory label(s) into the catalog tree', added;
END $$;

-- ---------------------------------------------------------------------------
-- 3) Refresh the tags column so browse badges reflect any newly joined labels.
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

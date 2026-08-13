-- Acceptance Test Results 08/12/2026 (Task 1.2) — join Themes Directory arrays to the hierarchy.
--
--   "New Table: Theme Directory - attributes 4 thru 15 arrays needs to be joined with
--    New Table: Themes Directory Catalog > category > type > sub-types Array"
--
-- `public."Themes Directory"` holds ONE row whose array columns name the categories that belong to
-- each theme. Read from the live database:
--
--   market_place   = {Holiday Market, Pop-up Market}
--   meet_up        = {Business Networking, Professional Groups, Community Groups,
--                     Support Groups, VanLife, Online Dating}
--   special_event  = {Awards Ceremony, Product Launch, Convention, Fundraiser, Conference, Seminar}
--   sporting       = {Basketball Game, Football Event}
--   parties        = {Birthday Party, Holiday Party}
--
-- Nothing ever projected those into `event_types`, which is why categories ended up under the
-- wrong theme. Cross-referencing the arrays against the live tree showed the Marketplace theme
-- holding only two EMPTY categories while Artisans / Food / Vendors / Vintage — 62 rows with their
-- sub-types — sat inside the Meetup theme. That is exactly:
--
--   "Marketplace > category types missing sub-tasks, listed in Meetup > type > sub-types"
--   "Meetup > category type mixed with Marketplace types and sub-types"
--
-- Theme ids are resolved from the catalog at run time; none are hard-coded.
-- Idempotent and safe to re-run.

-- ---------------------------------------------------------------------------
-- 1) Every category named in a Themes Directory array is moved to that theme,
--    together with its whole sub-tree.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  mapping RECORD;
  target_theme integer;
  category_names text[];
  label text;
  moved integer := 0;
BEGIN
  FOR mapping IN
    SELECT * FROM (VALUES
      ('market_place',  '%market%'),
      ('meet_up',       '%meet%'),
      ('special_event', '%special%'),
      ('sporting',      '%sport%'),
      ('parties',       '%celebration%')
    ) AS t(array_column, theme_pattern)
  LOOP
    SELECT id INTO target_theme
    FROM "Themes Directory Catalog"
    WHERE lower(btrim(name)) LIKE mapping.theme_pattern
    ORDER BY id
    LIMIT 1;

    CONTINUE WHEN target_theme IS NULL;

    BEGIN
      EXECUTE format('SELECT %I FROM "Themes Directory" LIMIT 1', mapping.array_column)
        INTO category_names;
    EXCEPTION WHEN undefined_column OR undefined_table THEN
      CONTINUE;
    END;

    CONTINUE WHEN category_names IS NULL OR array_length(category_names, 1) IS NULL;

    FOREACH label IN ARRAY category_names
    LOOP
      CONTINUE WHEN btrim(coalesce(label, '')) = '';

      UPDATE event_types
      SET theme_id = target_theme, parent_id = NULL
      WHERE lower(btrim(name)) = lower(btrim(label))
        AND theme_id IS DISTINCT FROM target_theme;

      GET DIAGNOSTICS moved = ROW_COUNT;
      IF moved > 0 THEN
        RAISE NOTICE 'Moved category % to theme % (%)', label, target_theme, mapping.array_column;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Marketplace's own categories, which are living in the Meetup theme.
--
--    Artisans / Food / Vendors / Vintage are not named in any Themes Directory
--    array, but the client is explicit that they are Marketplace and that they
--    are currently showing under Meetup. Move each root and its sub-tree.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  market_theme integer;
  cat RECORD;
  depth integer;
BEGIN
  SELECT id INTO market_theme
  FROM "Themes Directory Catalog"
  WHERE lower(btrim(name)) LIKE '%market%'
  ORDER BY id
  LIMIT 1;

  IF market_theme IS NULL THEN RETURN; END IF;

  FOR cat IN
    SELECT id, name FROM event_types
    WHERE lower(btrim(name)) IN ('artisans', 'food', 'vendors', 'vintage')
      AND parent_id IS NULL
      AND theme_id IS DISTINCT FROM market_theme
      -- Only a populated branch: never move an empty duplicate placeholder.
      AND EXISTS (SELECT 1 FROM event_types c WHERE c.parent_id = event_types.id)
  LOOP
    UPDATE event_types SET theme_id = market_theme WHERE id = cat.id;
    RAISE NOTICE 'Moved Marketplace category % (id %) out of the Meetup theme', cat.name, cat.id;
  END LOOP;

  -- Children follow their parent, repeated so deeper sub-types are carried too.
  FOR depth IN 1..6 LOOP
    UPDATE event_types child
    SET theme_id = parent.theme_id
    FROM event_types parent
    WHERE child.parent_id = parent.id
      AND parent.theme_id IS NOT NULL
      AND child.theme_id IS DISTINCT FROM parent.theme_id;
    EXIT WHEN NOT FOUND;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3) Drop the empty duplicate categories left behind in the wrong theme.
--
--    Guarded: a row is only removed when it has no children AND another row of
--    the same name, in a different theme, does have children.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  doomed integer[];
BEGIN
  SELECT array_agg(e.id) INTO doomed
  FROM event_types e
  WHERE NOT EXISTS (SELECT 1 FROM event_types c WHERE c.parent_id = e.id)
    AND EXISTS (
      SELECT 1 FROM event_types other
      WHERE lower(btrim(other.name)) = lower(btrim(e.name))
        AND other.id <> e.id
        AND other.theme_id IS DISTINCT FROM e.theme_id
        AND EXISTS (SELECT 1 FROM event_types oc WHERE oc.parent_id = other.id)
    );

  IF doomed IS NOT NULL THEN
    UPDATE events SET type_id = NULL WHERE type_id = ANY (doomed);
    DELETE FROM event_types WHERE id = ANY (doomed);
    RAISE NOTICE 'Removed % empty duplicate category row(s)', array_length(doomed, 1);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4) Report the resulting shape per theme.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT th.name AS theme,
           count(*) FILTER (WHERE e.parent_id IS NULL) AS categories,
           count(*) AS total
    FROM event_types e
    JOIN "Themes Directory Catalog" th ON th.id = e.theme_id
    GROUP BY th.name
    ORDER BY th.name
  LOOP
    RAISE NOTICE 'SHAPE  %  categories=%  total=%', r.theme, r.categories, r.total;
  END LOOP;
END $$;

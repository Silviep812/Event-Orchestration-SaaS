-- Acceptance Test Results 08/12/2026 (Task 1.2) — join Themes Directory arrays to the hierarchy.
--
--   "New Table: Theme Directory - attributes 4 thru 15 arrays needs to be joined with
--    New Table: Themes Directory Catalog > category > type > sub-types Array"
--
-- `public."Themes Directory"` holds ONE row whose array columns name the categories belonging to
-- each theme. Read from the live database:
--
--   market_place   = {Holiday Market, Pop-up Market}
--   meet_up        = {Business Networking, Professional Groups, Community Groups,
--                     Support Groups, VanLife, Online Dating}
--   special_event  = {Awards Ceremony, Product Launch, Convention, Fundraiser, Conference, Seminar}
--   sporting       = {Basketball Game, Football Event}
--   parties        = {Birthday Party, Holiday Party}
--
-- Nothing ever projected those into `event_types`. Cross-referencing them against the live tree
-- showed the Marketplace theme holding only two EMPTY categories while Artisans / Food / Vendors /
-- Vintage — 62 rows with their sub-types — sat inside the Meetup theme. That is exactly:
--
--   "Marketplace > category types missing sub-tasks, listed in Meetup > type > sub-types"
--   "Meetup > category type mixed with Marketplace types and sub-types"
--
-- Theme ids are resolved from the catalog at run time; none are hard-coded.
--
-- A first version of this migration moved rows with a plain UPDATE and failed on the live data:
--
--   ERROR 23505: duplicate key value violates "event_types_unique_root_label_per_theme"
--   DETAIL: Key (theme_id, lower(btrim(name)))=(9, holiday market) already exists.
--
-- "Holiday Market" exists twice — once orphaned with theme_id NULL, once properly in theme 9 — so
-- moving the orphan collided with the real row. Every move below therefore MERGES into an existing
-- row when one is already present, and only relocates when the target has none.
--
-- Idempotent and safe to re-run.

-- ---------------------------------------------------------------------------
-- Helper: fold `p_source` into `p_keeper`, carrying children and events across.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp._iep_merge_into(p_source integer, p_keeper integer)
RETURNS void LANGUAGE plpgsql AS $fn$
BEGIN
  IF p_source IS NULL OR p_keeper IS NULL OR p_source = p_keeper THEN
    RETURN;
  END IF;
  UPDATE event_types SET parent_id = p_keeper WHERE parent_id = p_source;
  UPDATE events SET type_id = p_keeper WHERE type_id = p_source;
  DELETE FROM event_types WHERE id = p_source;
END $fn$;

-- ---------------------------------------------------------------------------
-- Helper: collapse duplicate labels under one parent, keeping the richest row.
-- Merging branches together can bring two same-named children side by side,
-- which the per-parent unique index rejects.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp._iep_dedupe_children()
RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE
  dup RECORD;
  keeper integer;
  pass integer;
  merged integer;
BEGIN
  FOR pass IN 1..10 LOOP
    merged := 0;
    FOR dup IN
      SELECT array_agg(id ORDER BY id) AS ids
      FROM event_types
      GROUP BY theme_id, parent_id, lower(btrim(name))
      HAVING count(*) > 1
    LOOP
      SELECT et.id INTO keeper
      FROM event_types et
      WHERE et.id = ANY (dup.ids)
      ORDER BY (SELECT count(*) FROM event_types c WHERE c.parent_id = et.id) DESC, et.id
      LIMIT 1;

      CONTINUE WHEN keeper IS NULL;

      PERFORM pg_temp._iep_merge_into(x, keeper)
      FROM unnest(dup.ids) AS x
      WHERE x <> keeper;

      merged := merged + 1;
    END LOOP;
    EXIT WHEN merged = 0;
  END LOOP;
END $fn$;

-- ---------------------------------------------------------------------------
-- 0) Return ethnic groups to Festival > Heritage.
--
--    The orphaned "Pop-up Market" row is holding 15 ethnic groups — African
--    American, Irish American, Hispanic/Latino American, Pacific Islander
--    American and so on. That is the client's original Heritage list, filed
--    under a Marketplace category. It has to move BEFORE the array projection
--    below merges that orphan into the real Marketplace row, or the groups
--    would surface under Marketplace > Pop-up Market.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  heritage_id integer;
  festival_theme integer;
  grp RECORD;
  twin integer;
  moved integer := 0;
BEGIN
  SELECT th.id INTO festival_theme
  FROM "Themes Directory Catalog" th
  WHERE lower(btrim(th.name)) LIKE 'festival%'
  ORDER BY th.id
  LIMIT 1;

  IF festival_theme IS NULL THEN RETURN; END IF;

  SELECT id INTO heritage_id
  FROM event_types
  WHERE theme_id = festival_theme AND lower(btrim(name)) = 'heritage'
  ORDER BY (parent_id IS NULL) DESC, id
  LIMIT 1;

  IF heritage_id IS NULL THEN RETURN; END IF;

  FOR grp IN
    SELECT child.id, child.name
    FROM event_types child
    JOIN event_types parent ON parent.id = child.parent_id
    WHERE parent.id <> heritage_id
      AND lower(btrim(parent.name)) IN ('pop-up market', 'holiday market', 'market place', 'marketplace')
      AND (child.name ILIKE '%american%' OR child.name ILIKE '%indigenous%')
  LOOP
    -- Already present under Heritage? Fold it in rather than duplicating.
    SELECT id INTO twin
    FROM event_types
    WHERE parent_id = heritage_id
      AND lower(btrim(name)) = lower(btrim(grp.name))
      AND id <> grp.id
    LIMIT 1;

    IF twin IS NOT NULL THEN
      PERFORM pg_temp._iep_merge_into(grp.id, twin);
    ELSE
      UPDATE event_types
      SET parent_id = heritage_id, theme_id = festival_theme
      WHERE id = grp.id;
    END IF;
    moved := moved + 1;
  END LOOP;

  RAISE NOTICE 'Returned % ethnic group row(s) to Festival > Heritage', moved;
END $$;

-- ---------------------------------------------------------------------------
-- 1) Project each Themes Directory array onto its theme.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  mapping RECORD;
  target_theme integer;
  category_names text[];
  label text;
  keeper integer;
  stray RECORD;
BEGIN
  FOR mapping IN
    SELECT * FROM (VALUES
      ('market_place',  '%market%'),
      ('meet_up',       '%meet%'),
      ('special_event', '%special%'),
      ('sporting',      '%sport%')
      -- "parties" is deliberately NOT mapped to Celebration. It holds
      -- {Birthday Party, Holiday Party}, which are TYPES, not categories:
      -- celebration_types is {holiday, personal} and 20260812190000 files both
      -- of those labels underneath Personal / Holiday. Projecting the column
      -- here promotes them back to top level and undoes that repair. Dry-run
      -- against the live snapshot confirmed the conflict.
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

      -- Prefer the row already in the target theme, richest first.
      SELECT et.id INTO keeper
      FROM event_types et
      WHERE et.theme_id = target_theme
        AND et.parent_id IS NULL
        AND lower(btrim(et.name)) = lower(btrim(label))
      ORDER BY (SELECT count(*) FROM event_types c WHERE c.parent_id = et.id) DESC, et.id
      LIMIT 1;

      FOR stray IN
        SELECT id FROM event_types
        WHERE lower(btrim(name)) = lower(btrim(label))
          AND (theme_id IS DISTINCT FROM target_theme OR parent_id IS NOT NULL)
          AND id IS DISTINCT FROM keeper
        ORDER BY id
      LOOP
        IF keeper IS NULL THEN
          -- Nothing in the target theme yet: relocate this one and adopt it.
          UPDATE event_types
          SET theme_id = target_theme, parent_id = NULL
          WHERE id = stray.id;
          keeper := stray.id;
          RAISE NOTICE 'Moved category % into theme % (%)',
            label, target_theme, mapping.array_column;
        ELSE
          PERFORM pg_temp._iep_merge_into(stray.id, keeper);
          RAISE NOTICE 'Merged duplicate category % into id % (%)',
            label, keeper, mapping.array_column;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;

  PERFORM pg_temp._iep_dedupe_children();
END $$;

-- ---------------------------------------------------------------------------
-- 2) Marketplace's own categories, currently living in the Meetup theme.
--
--    Artisans / Food / Vendors / Vintage are not named in any Themes Directory
--    array, but the client is explicit that they are Marketplace and that they
--    show under Meetup today. Move each populated root and its sub-tree.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  market_theme integer;
  cat RECORD;
  keeper integer;
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
      -- Populated branch only: never move an empty placeholder.
      AND EXISTS (SELECT 1 FROM event_types c WHERE c.parent_id = event_types.id)
  LOOP
    -- An empty same-named row may already occupy the Marketplace theme.
    SELECT id INTO keeper
    FROM event_types
    WHERE theme_id = market_theme
      AND parent_id IS NULL
      AND lower(btrim(name)) = lower(btrim(cat.name))
      AND id <> cat.id
    ORDER BY id
    LIMIT 1;

    IF keeper IS NOT NULL THEN
      -- Drop the placeholder, then take its place.
      PERFORM pg_temp._iep_merge_into(keeper, cat.id);
    END IF;

    UPDATE event_types SET theme_id = market_theme WHERE id = cat.id;
    RAISE NOTICE 'Moved Marketplace category % (id %) out of the Meetup theme', cat.name, cat.id;
  END LOOP;

  -- Children follow their parent, repeated so deeper sub-types come along.
  FOR depth IN 1..6 LOOP
    UPDATE event_types child
    SET theme_id = parent.theme_id
    FROM event_types parent
    WHERE child.parent_id = parent.id
      AND parent.theme_id IS NOT NULL
      AND child.theme_id IS DISTINCT FROM parent.theme_id;
    EXIT WHEN NOT FOUND;
  END LOOP;

  PERFORM pg_temp._iep_dedupe_children();
END $$;

-- ---------------------------------------------------------------------------
-- 3) Remove empty duplicates left in the wrong theme.
--
--    Guarded: only a childless row whose name is carried, WITH children, by a
--    row in a different theme.
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

-- ---------------------------------------------------------------------------
-- 5) Report categories that carry no types, rather than inventing any.
--
--    "Themes Directory" names these but supplies nothing underneath them — e.g.
--    market_place {Holiday Market, Pop-up Market} and the six meet_up entries,
--    which sit beside the genuinely populated categories (Artisans/Food/
--    Vendors/Vintage, Community/Inclusive) with zero children. Whether they are
--    categories in their own right, types belonging under one of those, or
--    obsolete is the client's call, so they are listed and left untouched.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT th.name AS theme, e.name AS category
    FROM event_types e
    JOIN "Themes Directory Catalog" th ON th.id = e.theme_id
    WHERE e.parent_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM event_types c WHERE c.parent_id = e.id)
    ORDER BY th.name, e.name
  LOOP
    RAISE NOTICE 'NEEDS TYPES  % > %', r.theme, r.category;
  END LOOP;
END $$;

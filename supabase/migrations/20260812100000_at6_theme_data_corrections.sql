-- Acceptance Test Results 08/12/2026 — theme data corrections.
--
--   * "Sporting; remove Event formats"
--   * "Health and Wellness > remove type Rejuvenation; Rejuvenating is correct;
--      Spiritual has Meetup > Community sub-types mixed in as sub-types;
--      Remove mindfulness and wellness types (bottom of category)"
--   * "Restore Marketplace entries"
--   * "Celebration two categories 'Holiday and Personal' ... separate sub-types"
--
-- Idempotent and safe to re-run.

-- ---------------------------------------------------------------------------
-- 1) Sporting: drop the "Event formats" wrapper row
--
--    An earlier migration renamed the Sporting root row to "Event formats" so it
--    would not duplicate the theme name. The client does not want that level at
--    all. Promote its children to top level for the theme, then delete it.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  wrapper RECORD;
BEGIN
  FOR wrapper IN
    SELECT et.id, et.theme_id
    FROM event_types et
    JOIN "Themes Directory Catalog" th ON th.id = et.theme_id
    WHERE lower(btrim(th.name)) IN ('sporting', 'sport', 'sports')
      AND et.parent_id IS NULL
      AND lower(btrim(et.name)) = 'event formats'
  LOOP
    UPDATE event_types SET parent_id = NULL WHERE parent_id = wrapper.id;
    UPDATE events SET type_id = NULL WHERE type_id = wrapper.id;
    DELETE FROM event_types WHERE id = wrapper.id;
    RAISE NOTICE 'Removed Sporting "Event formats" wrapper (id %)', wrapper.id;
  END LOOP;

  -- And out of the legacy tags column.
  UPDATE "Themes Directory Catalog"
  SET tags = ARRAY(
    SELECT t FROM unnest(COALESCE(tags, ARRAY[]::text[])) AS t
    WHERE lower(btrim(t)) <> 'event formats'
  )
  WHERE lower(btrim(name)) IN ('sporting', 'sport', 'sports');
END $$;

-- ---------------------------------------------------------------------------
-- 2) Health & Wellness corrections
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  hw_theme_id integer;
  meetup_theme_id integer;
  doomed integer[];
BEGIN
  SELECT id INTO hw_theme_id
  FROM "Themes Directory Catalog"
  WHERE lower(name) LIKE '%health%' AND lower(name) LIKE '%wellness%'
  ORDER BY id LIMIT 1;

  IF hw_theme_id IS NULL THEN
    RETURN;
  END IF;

  -- 2a) "remove type Rejuvenation; Rejuvenating is correct"
  SELECT array_agg(id) INTO doomed
  FROM event_types
  WHERE theme_id = hw_theme_id
    AND lower(btrim(name)) = 'rejuvenation';

  IF doomed IS NOT NULL THEN
    UPDATE events SET type_id = NULL WHERE type_id = ANY (doomed);
    UPDATE event_types SET parent_id = NULL WHERE parent_id = ANY (doomed);
    DELETE FROM event_types WHERE id = ANY (doomed);
    RAISE NOTICE 'Removed % Health & Wellness "Rejuvenation" row(s)', array_length(doomed, 1);
  END IF;

  -- 2b) "Remove mindfulness and wellness types (bottom of category)"
  SELECT array_agg(id) INTO doomed
  FROM event_types
  WHERE theme_id = hw_theme_id
    AND lower(btrim(name)) IN ('mindfulness', 'wellness');

  IF doomed IS NOT NULL THEN
    UPDATE events SET type_id = NULL WHERE type_id = ANY (doomed);
    UPDATE event_types SET parent_id = NULL WHERE parent_id = ANY (doomed);
    DELETE FROM event_types WHERE id = ANY (doomed);
    RAISE NOTICE 'Removed % Health & Wellness mindfulness/wellness row(s)', array_length(doomed, 1);
  END IF;

  -- 2c) "Spiritual has Meetup > Community sub-types mixed in as sub-types"
  --     Remove rows under H&W Spiritual whose label also exists under the Meetup
  --     theme — i.e. entries that belong to Meetup, not here.
  SELECT id INTO meetup_theme_id
  FROM "Themes Directory Catalog"
  WHERE lower(btrim(name)) LIKE '%meet%up%' OR lower(btrim(name)) LIKE '%meetup%'
  ORDER BY id LIMIT 1;

  IF meetup_theme_id IS NOT NULL THEN
    SELECT array_agg(child.id) INTO doomed
    FROM event_types child
    JOIN event_types spiritual
      ON spiritual.id = child.parent_id
     AND spiritual.theme_id = hw_theme_id
     AND lower(btrim(spiritual.name)) = 'spiritual'
    WHERE EXISTS (
      SELECT 1 FROM event_types m
      WHERE m.theme_id = meetup_theme_id
        AND lower(btrim(m.name)) = lower(btrim(child.name))
    );

    IF doomed IS NOT NULL THEN
      UPDATE events SET type_id = NULL WHERE type_id = ANY (doomed);
      DELETE FROM event_types WHERE id = ANY (doomed);
      RAISE NOTICE 'Removed % Meetup row(s) misfiled under Health & Wellness > Spiritual',
        array_length(doomed, 1);
    END IF;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3) Restore Marketplace categories
--
--    Artisans / Food / Vendors / Vintage were the Marketplace categories the
--    application previously read through its hard-coded lookup table. That
--    lookup has been removed (it leaked other themes' rows), so the categories
--    have to exist in `event_types` to appear at all.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  market_theme_id integer;
  root_id integer;
  root_count integer;
  cat text;
BEGIN
  SELECT id INTO market_theme_id
  FROM "Themes Directory Catalog"
  WHERE lower(btrim(name)) LIKE '%market%'
  ORDER BY id LIMIT 1;

  IF market_theme_id IS NULL THEN
    RETURN;
  END IF;

  SELECT count(*) INTO root_count
  FROM event_types WHERE theme_id = market_theme_id AND parent_id IS NULL;

  IF root_count = 1 THEN
    SELECT id INTO root_id
    FROM event_types WHERE theme_id = market_theme_id AND parent_id IS NULL LIMIT 1;
    -- Only treat it as a wrapper when it already holds categories.
    IF NOT EXISTS (SELECT 1 FROM event_types WHERE parent_id = root_id) THEN
      root_id := NULL;
    END IF;
  ELSE
    root_id := NULL;
  END IF;

  FOREACH cat IN ARRAY ARRAY['Artisans', 'Food', 'Vendors', 'Vintage']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM event_types
      WHERE theme_id = market_theme_id
        AND parent_id IS NOT DISTINCT FROM root_id
        AND lower(btrim(name)) = lower(cat)
    ) THEN
      INSERT INTO event_types (name, parent_id, theme_id)
      VALUES (cat, root_id, market_theme_id);
      RAISE NOTICE 'Restored Marketplace category %', cat;
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4) Celebration: Holiday and Personal must hold their own separate types
--
--    Values from Themes Directory Catalog.holiday_types / personal_types.
--    Any type sitting under one that belongs to the other is moved across.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  celebration_theme_id integer;
  holiday_id integer;
  personal_id integer;
  root_id integer;
  root_count integer;
  label text;
  holiday_labels text[] := ARRAY[
    'New Years Day','MLK Day','Presidents Day','Memorial Day','Independence Day',
    'Labor Day','Columbus Day','Veterans Day','Thanksgiving','Christmas'
  ];
  personal_labels text[] := ARRAY['Baby Shower','Birthday Party','Anniversary','Graduation'];
BEGIN
  SELECT id INTO celebration_theme_id
  FROM "Themes Directory Catalog"
  WHERE lower(btrim(name)) LIKE '%celebration%'
  ORDER BY id LIMIT 1;

  IF celebration_theme_id IS NULL THEN
    RETURN;
  END IF;

  SELECT count(*) INTO root_count
  FROM event_types WHERE theme_id = celebration_theme_id AND parent_id IS NULL;

  IF root_count = 1 THEN
    SELECT id INTO root_id
    FROM event_types WHERE theme_id = celebration_theme_id AND parent_id IS NULL LIMIT 1;
    IF NOT EXISTS (SELECT 1 FROM event_types WHERE parent_id = root_id) THEN
      root_id := NULL;
    END IF;
  ELSE
    root_id := NULL;
  END IF;

  SELECT id INTO holiday_id
  FROM event_types
  WHERE theme_id = celebration_theme_id
    AND regexp_replace(lower(btrim(name)), 's$', '') = 'holiday'
  ORDER BY id LIMIT 1;

  IF holiday_id IS NULL THEN
    INSERT INTO event_types (name, parent_id, theme_id)
    VALUES ('Holiday', root_id, celebration_theme_id) RETURNING id INTO holiday_id;
  END IF;

  SELECT id INTO personal_id
  FROM event_types
  WHERE theme_id = celebration_theme_id
    AND regexp_replace(lower(btrim(name)), 's$', '') = 'personal'
  ORDER BY id LIMIT 1;

  IF personal_id IS NULL THEN
    INSERT INTO event_types (name, parent_id, theme_id)
    VALUES ('Personal', root_id, celebration_theme_id) RETURNING id INTO personal_id;
  END IF;

  FOREACH label IN ARRAY holiday_labels
  LOOP
    -- Move it across if it was filed under Personal, else create it.
    UPDATE event_types SET parent_id = holiday_id
    WHERE theme_id = celebration_theme_id
      AND parent_id = personal_id
      AND lower(btrim(name)) = lower(label);

    IF NOT EXISTS (
      SELECT 1 FROM event_types
      WHERE parent_id = holiday_id AND lower(btrim(name)) = lower(label)
    ) THEN
      INSERT INTO event_types (name, parent_id, theme_id)
      VALUES (label, holiday_id, celebration_theme_id);
    END IF;
  END LOOP;

  FOREACH label IN ARRAY personal_labels
  LOOP
    UPDATE event_types SET parent_id = personal_id
    WHERE theme_id = celebration_theme_id
      AND parent_id = holiday_id
      AND lower(btrim(name)) = lower(label);

    IF NOT EXISTS (
      SELECT 1 FROM event_types
      WHERE parent_id = personal_id AND lower(btrim(name)) = lower(label)
    ) THEN
      INSERT INTO event_types (name, parent_id, theme_id)
      VALUES (label, personal_id, celebration_theme_id);
    END IF;
  END LOOP;
END $$;

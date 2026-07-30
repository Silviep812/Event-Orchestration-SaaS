-- Task 1: Align Themes directory data
-- Dining categories (Contemporary / Buffet / Fine Dining), Special Event Charity→Convention,
-- remove Social Meetup leftovers, restore Festival Heritage category children.

-- ---------------------------------------------------------------------------
-- 1) Dining: keep a single canonical Dining theme; ensure categories under it
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  canonical_dining_id integer;
  dup_id integer;
BEGIN
  SELECT id INTO canonical_dining_id
  FROM "Themes Directory Catalog"
  WHERE lower(name) = 'dining'
  ORDER BY id
  LIMIT 1;

  IF canonical_dining_id IS NULL THEN
    INSERT INTO "Themes Directory Catalog" (name, description, premium)
    VALUES ('Dining', 'Curated dining experiences — contemporary menus, buffets, and fine dining', false)
    RETURNING id INTO canonical_dining_id;
  END IF;

  -- Reparent any Dining event_types that point at a different Dining catalog row
  FOR dup_id IN
    SELECT id FROM "Themes Directory Catalog"
    WHERE lower(name) = 'dining' AND id <> canonical_dining_id
  LOOP
    UPDATE event_types SET theme_id = canonical_dining_id WHERE theme_id = dup_id;
  END LOOP;

  -- Ensure category parents exist
  IF NOT EXISTS (
    SELECT 1 FROM event_types
    WHERE theme_id = canonical_dining_id AND parent_id IS NULL AND lower(name) = 'contemporary'
  ) THEN
    INSERT INTO event_types (name, theme_id, parent_id) VALUES ('Contemporary', canonical_dining_id, NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM event_types
    WHERE theme_id = canonical_dining_id AND parent_id IS NULL AND lower(name) = 'buffet'
  ) THEN
    INSERT INTO event_types (name, theme_id, parent_id) VALUES ('Buffet', canonical_dining_id, NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM event_types
    WHERE theme_id = canonical_dining_id AND parent_id IS NULL AND lower(name) = 'fine dining'
  ) THEN
    INSERT INTO event_types (name, theme_id, parent_id) VALUES ('Fine Dining', canonical_dining_id, NULL);
  END IF;

  -- Align theme_id for known Dining category parents and their children
  UPDATE event_types et
  SET theme_id = canonical_dining_id
  WHERE lower(et.name) IN ('contemporary', 'buffet', 'fine dining')
     OR et.parent_id IN (
       SELECT id FROM event_types
       WHERE theme_id = canonical_dining_id
         AND parent_id IS NULL
         AND lower(name) IN ('contemporary', 'buffet', 'fine dining')
     )
     OR et.theme_id IN (
       SELECT id FROM "Themes Directory Catalog" WHERE lower(name) = 'dining'
     );
END $$;

-- ---------------------------------------------------------------------------
-- 2) Special Event: Charity → Convention
-- ---------------------------------------------------------------------------
UPDATE event_types
SET name = 'Convention'
WHERE lower(name) IN ('charity', 'charity gala')
  AND (
    theme_id IN (SELECT id FROM "Themes Directory Catalog" WHERE lower(name) LIKE '%special%')
    OR parent_id IN (
      SELECT id FROM event_types
      WHERE theme_id IN (SELECT id FROM "Themes Directory Catalog" WHERE lower(name) LIKE '%special%')
    )
  );

-- Legacy Themes Directory array cleanup (best-effort; ignore if column/type differs)
DO $$
BEGIN
  UPDATE "Themes Directory"
  SET special_event = array_replace(special_event, 'Charity Gala', 'Convention')
  WHERE special_event IS NOT NULL AND 'Charity Gala' = ANY (special_event);
EXCEPTION WHEN undefined_column OR undefined_table OR datatype_mismatch THEN
  NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 3) Remove Social Meetup leftovers
-- ---------------------------------------------------------------------------
DELETE FROM event_types
WHERE lower(name) IN ('social meetup', 'social meet-up', 'social meet up');

DO $$
BEGIN
  UPDATE "Themes Directory"
  SET meet_up = array_remove(meet_up, 'Social Meetup')
  WHERE meet_up IS NOT NULL AND 'Social Meetup' = ANY (meet_up);
EXCEPTION WHEN undefined_column OR undefined_table OR datatype_mismatch THEN
  NULL;
END $$;

DO $$
BEGIN
  UPDATE "Themes Directory"
  SET meet_up = array_remove(meet_up, 'Social Meet-up')
  WHERE meet_up IS NOT NULL AND 'Social Meet-up' = ANY (meet_up);
EXCEPTION WHEN undefined_column OR undefined_table OR datatype_mismatch THEN
  NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 4) Restore Festival Heritage category + children (theme_id = 4 historically)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  festival_theme_id integer;
  heritage_id integer;
BEGIN
  SELECT id INTO festival_theme_id
  FROM "Themes Directory Catalog"
  WHERE lower(name) LIKE 'festival%'
  ORDER BY id
  LIMIT 1;

  IF festival_theme_id IS NULL THEN
    festival_theme_id := 4;
  END IF;

  SELECT id INTO heritage_id
  FROM event_types
  WHERE lower(name) = 'heritage'
    AND theme_id = festival_theme_id
    AND parent_id IS NULL
  LIMIT 1;

  IF heritage_id IS NULL THEN
    INSERT INTO event_types (name, parent_id, theme_id)
    VALUES ('Heritage', NULL, festival_theme_id)
    RETURNING id INTO heritage_id;
  END IF;

  INSERT INTO event_types (name, parent_id, theme_id)
  SELECT v.name, heritage_id, festival_theme_id
  FROM (VALUES
    ('Cultural Heritage'),
    ('Family Heritage'),
    ('Community Heritage'),
    ('Historical Heritage'),
    ('Ethnic Heritage')
  ) AS v(name)
  WHERE NOT EXISTS (
    SELECT 1 FROM event_types et
    WHERE et.parent_id = heritage_id AND lower(et.name) = lower(v.name)
  );
END $$;

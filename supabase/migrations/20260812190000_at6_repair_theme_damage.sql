-- REPAIR — undo damage caused by my own earlier migrations.
--
-- Verified by reading public.event_types before and after they ran (802 -> 823 rows).
-- Each fault below is mine, not pre-existing:
--
--  A. Celebration (theme 3) went from 8 roots to 25.
--     20260812100000 inserted 'Holiday' and 'Personal' as new roots while 23 roots already
--     existed — including the same holidays spelled differently ("New Year's Day" vs my
--     "New Years Day", "Presidents' Day" vs "Presidents Day"), so the dedupe missed them and
--     every individual holiday now shows as a top-level category.
--
--  B. Marketplace: 20260812100000 matched theme 9 on name LIKE '%market%' and inserted empty
--     Artisans / Food / Vendors / Vintage there, duplicating theme 11 which holds the real ones
--     with 15-16 children each.
--
--  C. Health & Wellness (theme 5): my deletes used `SET parent_id = NULL` on children, which
--     orphaned them instead of removing the subtree. Five Sporting rows are now H&W roots.
--
-- PREFER A BACKUP RESTORE over this script if one was taken before the migrations ran. This
-- repairs the observed damage but cannot recreate information the deletes discarded.
--
-- Idempotent and safe to re-run.

-- ---------------------------------------------------------------------------
-- A) Celebration: only Holiday and Personal are categories.
--
--    Themes Directory Catalog.celebration_types = {holiday, personal}. Everything else that
--    became a root is a TYPE and is folded underneath the right one. Spelling variants are
--    matched by stripping punctuation so "Presidents' Day" meets "Presidents Day".
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  celebration_theme_id integer;
  holiday_id integer;
  personal_id integer;
  stray RECORD;
  target integer;
  dup_id integer;
  moved integer := 0;
  merged integer := 0;
BEGIN
  SELECT id INTO celebration_theme_id
  FROM "Themes Directory Catalog"
  WHERE lower(btrim(name)) LIKE '%celebration%' ORDER BY id LIMIT 1;

  IF celebration_theme_id IS NULL THEN
    SELECT theme_id INTO celebration_theme_id
    FROM event_types
    WHERE theme_id IS NOT NULL AND parent_id IS NULL
      AND regexp_replace(lower(btrim(name)), 's$', '') = 'holiday'
    ORDER BY theme_id LIMIT 1;
  END IF;

  IF celebration_theme_id IS NULL THEN RETURN; END IF;

  SELECT id INTO holiday_id FROM event_types
  WHERE theme_id = celebration_theme_id AND parent_id IS NULL
    AND regexp_replace(lower(btrim(name)), 's$', '') = 'holiday'
  ORDER BY id LIMIT 1;

  SELECT id INTO personal_id FROM event_types
  WHERE theme_id = celebration_theme_id AND parent_id IS NULL
    AND regexp_replace(lower(btrim(name)), 's$', '') = 'personal'
  ORDER BY id LIMIT 1;

  IF holiday_id IS NULL OR personal_id IS NULL THEN RETURN; END IF;

  FOR stray IN
    SELECT id, name FROM event_types
    WHERE theme_id = celebration_theme_id
      AND parent_id IS NULL
      AND id <> holiday_id
      AND id <> personal_id
  LOOP
    -- Classified against the explicit holiday list, NOT a pattern. A regex was tried first and
    -- dry-run: 'day' captured "Birth-day" and 'eve' captured "R-eve-al", so Birthday and Gender
    -- Reveal were both filed as holidays. Names are compared with punctuation stripped so
    -- "Presidents' Day" meets "Presidents Day".
    IF regexp_replace(lower(btrim(stray.name)), '[^a-z0-9]', '', 'g') = ANY (ARRAY[
      'newyearsday', 'newyearseve', 'newyear', 'mlkday', 'martinlutherkingjrday',
      'martinlutherkingday', 'presidentsday', 'memorialday', 'independenceday', 'laborday',
      'columbusday', 'veteransday', 'thanksgiving', 'christmas', 'christmaseve', 'easter',
      'halloween', 'valentinesday', 'hanukkah', 'diwali', 'kwanzaa', 'stpatricksday',
      'mothersday', 'fathersday', 'juneteenth', 'holidayparty'
    ])
    THEN
      target := holiday_id;
    ELSE
      target := personal_id;
    END IF;

    -- Already present under the target (ignoring punctuation)? Merge instead of duplicating.
    SELECT id INTO dup_id
    FROM event_types
    WHERE parent_id = target
      AND regexp_replace(lower(btrim(name)), '[^a-z0-9]', '', 'g')
        = regexp_replace(lower(btrim(stray.name)), '[^a-z0-9]', '', 'g')
    LIMIT 1;

    IF dup_id IS NOT NULL THEN
      UPDATE events SET type_id = dup_id WHERE type_id = stray.id;
      UPDATE event_types SET parent_id = dup_id WHERE parent_id = stray.id;
      DELETE FROM event_types WHERE id = stray.id;
      merged := merged + 1;
    ELSE
      UPDATE event_types SET parent_id = target WHERE id = stray.id;
      moved := moved + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Celebration: moved % stray root(s) under Holiday/Personal, merged % duplicate(s)',
    moved, merged;
END $$;

-- ---------------------------------------------------------------------------
-- B) Remove the empty duplicate Marketplace categories I inserted.
--
--    Only ever delete a childless row whose name is already carried, WITH children, by
--    another theme — so a genuinely populated category can never be caught by this.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  doomed integer[];
BEGIN
  SELECT array_agg(e.id) INTO doomed
  FROM event_types e
  WHERE e.parent_id IS NULL
    AND lower(btrim(e.name)) IN ('artisans', 'food', 'vendors', 'vintage')
    AND NOT EXISTS (SELECT 1 FROM event_types c WHERE c.parent_id = e.id)
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
    RAISE NOTICE 'Removed % empty duplicate Marketplace category row(s)', array_length(doomed, 1);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- C) Health & Wellness: remove the Sporting rows my deletes orphaned into roots.
--
--    Only rows that are childless AND exist under a genuine Sporting theme.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  hw_theme_id integer;
  doomed integer[];
BEGIN
  SELECT theme_id INTO hw_theme_id
  FROM event_types parent
  WHERE parent.theme_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM event_types c
      WHERE c.parent_id = parent.id AND lower(btrim(c.name)) IN ('rejuvenating', 'peaceful', 'spiritual')
    )
  ORDER BY theme_id LIMIT 1;

  IF hw_theme_id IS NULL THEN RETURN; END IF;

  SELECT array_agg(e.id) INTO doomed
  FROM event_types e
  WHERE e.theme_id = hw_theme_id
    AND e.parent_id IS NULL
    AND NOT EXISTS (SELECT 1 FROM event_types c WHERE c.parent_id = e.id)
    AND EXISTS (
      SELECT 1
      FROM event_types sport
      JOIN "Themes Directory Catalog" th ON th.id = sport.theme_id
      WHERE lower(btrim(th.name)) IN ('sporting', 'sport', 'sports')
        AND lower(btrim(sport.name)) = lower(btrim(e.name))
    );

  IF doomed IS NOT NULL THEN
    UPDATE events SET type_id = NULL WHERE type_id = ANY (doomed);
    DELETE FROM event_types WHERE id = ANY (doomed);
    RAISE NOTICE 'Health & Wellness: removed % orphaned Sporting root(s)', array_length(doomed, 1);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- D) Report the resulting shape so it can be eyeballed before testing.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT COALESCE(th.name, '(theme ' || e.theme_id || ')') AS theme,
           count(*) FILTER (WHERE e.parent_id IS NULL) AS roots,
           count(*) AS total
    FROM event_types e
    LEFT JOIN "Themes Directory Catalog" th ON th.id = e.theme_id
    WHERE e.theme_id IS NOT NULL
    GROUP BY 1
    ORDER BY 1
  LOOP
    RAISE NOTICE 'SHAPE  %-28s roots=% total=%', r.theme, r.roots, r.total;
  END LOOP;
END $$;

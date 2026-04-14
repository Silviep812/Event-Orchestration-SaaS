-- Merge duplicate sport-themed rows in `event_themes` (Sport / Sports / Sporting) into one.
-- Canonical row = the id with the most `event_types` rows (the real catalog); tie-break lowest id.
-- Repoints: events.theme_id, event_types.theme_id, workflows.theme_id — then deletes loser theme rows.
-- No-op when there is already at most one matching theme.

DO $$
DECLARE
  sport_count integer;
  canon_id integer;
  loser_id integer;
BEGIN
  SELECT COUNT(*)::integer INTO sport_count
  FROM public.event_themes
  WHERE LOWER(TRIM(name)) IN ('sport', 'sports', 'sporting');

  IF sport_count IS NULL OR sport_count <= 1 THEN
    RETURN;
  END IF;

  SELECT st.id INTO canon_id
  FROM public.event_themes st
  LEFT JOIN public.event_types et ON et.theme_id = st.id
  WHERE LOWER(TRIM(st.name)) IN ('sport', 'sports', 'sporting')
  GROUP BY st.id
  ORDER BY COUNT(et.id) DESC, st.id ASC
  LIMIT 1;

  IF canon_id IS NULL THEN
    RETURN;
  END IF;

  FOR loser_id IN
    SELECT et.id
    FROM public.event_themes et
    WHERE LOWER(TRIM(et.name)) IN ('sport', 'sports', 'sporting')
      AND et.id <> canon_id
  LOOP
    UPDATE public.events SET theme_id = canon_id WHERE theme_id = loser_id;
    UPDATE public.event_types SET theme_id = canon_id WHERE theme_id = loser_id;
    UPDATE public.workflows SET theme_id = canon_id WHERE theme_id = loser_id;
    DELETE FROM public.event_themes WHERE id = loser_id;
  END LOOP;
END $$;

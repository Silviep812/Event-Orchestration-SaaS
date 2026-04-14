-- Theme captions, Sport types, Retreat branch labels (directory > category > type).

UPDATE public.event_themes
SET description = 'Perfect for building and strengthening personal, workplace and community relationships.'
WHERE name ILIKE '%retreat%'
  AND name NOT ILIKE '%health%';

UPDATE public.event_themes
SET description = 'Practice holistic health and exercises with like minded people'
WHERE name ILIKE '%health%'
  AND name ILIKE '%wellness%';

UPDATE public.event_themes
SET description = 'Great for reconnecting with family and friends'
WHERE name ILIKE '%reunion%';

UPDATE public.event_themes
SET description = 'Perfect to meet like minded people for a community experience'
WHERE name ILIKE '%meetup%';

INSERT INTO public.event_themes (name, description, tags, premium)
SELECT
  'Sport',
  'Tournaments, games, races, and spectator events',
  ARRAY['Sport']::text[],
  false
WHERE NOT EXISTS (
  SELECT 1 FROM public.event_themes WHERE LOWER(TRIM(name)) IN ('sport', 'sports')
);

DO $$
DECLARE
  sport_theme_id int;
  sport_parent_id int;
BEGIN
  SELECT id INTO sport_theme_id
  FROM public.event_themes
  WHERE LOWER(TRIM(name)) IN ('sport', 'sports')
  ORDER BY id
  LIMIT 1;

  IF sport_theme_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.event_types
    WHERE theme_id = sport_theme_id AND name = 'Sport' AND parent_id IS NULL
  ) THEN
    INSERT INTO public.event_types (name, theme_id, parent_id)
    VALUES ('Sport', sport_theme_id, NULL);
  END IF;

  SELECT id INTO sport_parent_id
  FROM public.event_types
  WHERE theme_id = sport_theme_id AND name = 'Sport' AND parent_id IS NULL
  LIMIT 1;

  IF sport_parent_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.event_types (name, theme_id, parent_id)
  SELECT v.name, sport_theme_id, sport_parent_id
  FROM (VALUES
    ('Tournaments'),
    ('Football games (HS, college & pro)'),
    ('Basketball games (HS, college & pro)'),
    ('Car races'),
    ('Dog shows')
  ) AS v(name)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.event_types et
    WHERE et.theme_id = sport_theme_id
      AND et.parent_id = sport_parent_id
      AND et.name = v.name
  );
END $$;

-- Health & Wellness: optional category rows under the theme root (coexists with legacy Peaceful / Spiritual / …).
DO $$
DECLARE
  hw_tid int;
  hw_root int;
  cat text;
BEGIN
  SELECT id INTO hw_tid
  FROM public.event_themes
  WHERE name ILIKE '%health%' AND name ILIKE '%wellness%'
  ORDER BY id
  LIMIT 1;

  IF hw_tid IS NULL THEN
    RETURN;
  END IF;

  SELECT id INTO hw_root
  FROM public.event_types
  WHERE theme_id = hw_tid AND parent_id IS NULL
  ORDER BY id
  LIMIT 1;

  IF hw_root IS NULL THEN
    RETURN;
  END IF;

  FOREACH cat IN ARRAY ARRAY[
    'Spa and nutrition',
    'Rejuvenation',
    'Mindful',
    'Tai Chi',
    'Holistic principles'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.event_types
      WHERE theme_id = hw_tid AND parent_id = hw_root AND name = cat
    ) THEN
      INSERT INTO public.event_types (name, theme_id, parent_id)
      VALUES (cat, hw_tid, hw_root);
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE
  retreat_theme_id int;
  branches text[] := ARRAY[
    'Skill building',
    'Personal development',
    'Building communities',
    'Support relationship',
    'Hybrid'
  ];
  branch_name text;
BEGIN
  SELECT id INTO retreat_theme_id
  FROM public.event_themes
  WHERE name ILIKE '%retreat%'
  ORDER BY id
  LIMIT 1;

  IF retreat_theme_id IS NULL THEN
    RETURN;
  END IF;

  FOREACH branch_name IN ARRAY branches
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.event_types
      WHERE theme_id = retreat_theme_id
        AND parent_id IS NULL
        AND name = branch_name
    ) THEN
      INSERT INTO public.event_types (name, theme_id, parent_id)
      VALUES (branch_name, retreat_theme_id, NULL);
    END IF;
  END LOOP;
END $$;

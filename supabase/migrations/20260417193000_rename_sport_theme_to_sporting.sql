-- V4: canonical theme and root directory row label "Sporting" (replaces Sport / Sports).

UPDATE public.event_themes
SET
  name = 'Sporting',
  tags = ARRAY[]::text[],
  description = COALESCE(
    NULLIF(TRIM(description), ''),
    'Tournaments, games, races, and spectator events'
  )
WHERE LOWER(TRIM(name)) IN ('sport', 'sports');

-- Root row is the directory *step* under the theme, not a second copy of the theme name.
UPDATE public.event_types et
SET name = 'Event formats'
FROM public.event_themes th
WHERE et.theme_id = th.id
  AND LOWER(TRIM(th.name)) = 'sporting'
  AND et.parent_id IS NULL
  AND LOWER(TRIM(et.name)) IN ('sport', 'sports');

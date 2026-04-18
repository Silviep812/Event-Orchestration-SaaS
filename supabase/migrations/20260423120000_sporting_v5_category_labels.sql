-- V5 Sporting: canonical category names (Directory > category > type).
-- Remove "(HS, college & pro)" qualifiers from Football / Basketball category rows and theme tags.

UPDATE public.event_types
SET name = 'Football games'
WHERE name = 'Football games (HS, college & pro)';

UPDATE public.event_types
SET name = 'Basketball games'
WHERE name = 'Basketball games (HS, college & pro)';

UPDATE public.event_themes t
SET tags = ARRAY(
  SELECT CASE
    WHEN u = 'Football games (HS, college & pro)' THEN 'Football games'
    WHEN u = 'Basketball games (HS, college & pro)' THEN 'Basketball games'
    ELSE u
  END
  FROM unnest(COALESCE(t.tags, ARRAY[]::text[])) AS u
)
WHERE COALESCE(t.tags, ARRAY[]::text[]) && ARRAY[
  'Football games (HS, college & pro)',
  'Basketball games (HS, college & pro)'
];

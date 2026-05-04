
-- Add Spiritual parent under Health & Wellness (skip if any already exist)
INSERT INTO public.event_types (name, parent_id, theme_id)
SELECT 'Spiritual', 16, 2
WHERE NOT EXISTS (
  SELECT 1 FROM public.event_types WHERE name = 'Spiritual' AND parent_id = 16
);

-- Add spiritual event subtypes under one canonical Spiritual row (lowest id if duplicates)
INSERT INTO public.event_types (name, parent_id, theme_id)
SELECT v.name, p.id, 2
FROM (
  SELECT id FROM public.event_types
  WHERE name = 'Spiritual' AND parent_id = 16
  ORDER BY id ASC
  LIMIT 1
) AS p(id)
CROSS JOIN (VALUES
  ('Baptism Ceremony'),
  ('Buddhist Meditation'),
  ('Chakra Balancing'),
  ('Christian Retreat'),
  ('Confirmation Service'),
  ('Energy Healing'),
  ('Faith Gathering'),
  ('Gospel Concert'),
  ('Hindu Puja'),
  ('Interfaith Service'),
  ('Jewish Shabbat'),
  ('Kirtan Chanting'),
  ('Labyrinth Walk'),
  ('Meditation Circle'),
  ('Mindful Prayer'),
  ('Prayer Service'),
  ('Reiki Session'),
  ('Sacred Ceremony'),
  ('Spiritual Workshop'),
  ('Vipassana Meditation'),
  ('Worship Service')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.event_types et
  WHERE et.parent_id = p.id AND et.name = v.name
);

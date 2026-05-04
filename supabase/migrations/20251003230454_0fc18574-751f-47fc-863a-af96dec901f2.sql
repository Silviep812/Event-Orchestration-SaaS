
-- Add Peaceful parent under Health & Wellness (skip if any already exist)
INSERT INTO public.event_types (name, parent_id, theme_id)
SELECT 'Peaceful', 16, 2
WHERE NOT EXISTS (
  SELECT 1 FROM public.event_types WHERE name = 'Peaceful' AND parent_id = 16
);

-- Add peaceful event subtypes under one canonical Peaceful row (lowest id if duplicates)
INSERT INTO public.event_types (name, parent_id, theme_id)
SELECT v.name, p.id, 2
FROM (
  SELECT id FROM public.event_types
  WHERE name = 'Peaceful' AND parent_id = 16
  ORDER BY id ASC
  LIMIT 1
) AS p(id)
CROSS JOIN (VALUES
  ('Aromatherapy Session'),
  ('Breathwork Circle'),
  ('Candlelight Meditation'),
  ('Forest Bathing'),
  ('Garden Meditation'),
  ('Guided Relaxation'),
  ('Healing Circle'),
  ('Lakeside Retreat'),
  ('Massage Retreat'),
  ('Mindfulness Workshop'),
  ('Nature Walk'),
  ('Quiet Contemplation'),
  ('Reflection Retreat'),
  ('Restorative Yoga'),
  ('Silent Meditation'),
  ('Sound Bath'),
  ('Tai Chi Class'),
  ('Tranquility Retreat'),
  ('Wellness Spa Day'),
  ('Yoga Nidra Session'),
  ('Zen Garden Experience')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.event_types et
  WHERE et.parent_id = p.id AND et.name = v.name
);

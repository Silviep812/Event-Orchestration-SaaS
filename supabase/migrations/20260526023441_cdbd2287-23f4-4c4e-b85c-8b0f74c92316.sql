INSERT INTO public.event_types (name, parent_id, theme_id)
SELECT v.name, v.parent_id, 13
FROM (VALUES
  ('Fusion', 490),
  ('Chef''s Table', 490),
  ('Tasting Menu', 490),
  ('Traditional Buffet', 508),
  ('Black Tie', 523),
  ('White Glove', 523),
  ('Prix Fixe', 523),
  ('Wine Pairing', 523),
  ('Formal Seated', 523)
) AS v(name, parent_id)
WHERE NOT EXISTS (
  SELECT 1 FROM public.event_types et
  WHERE et.parent_id = v.parent_id AND et.name = v.name
);
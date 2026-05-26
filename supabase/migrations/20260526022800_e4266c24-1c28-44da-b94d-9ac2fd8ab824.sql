INSERT INTO public.event_types (name, parent_id, theme_id)
SELECT v.name, 728, 4
FROM (VALUES
  ('African American'),
  ('Hispanic/Latino American'),
  ('Asian American'),
  ('Native American/Indigenous'),
  ('European American'),
  ('Middle Eastern American'),
  ('Caribbean American'),
  ('Pacific Islander American'),
  ('Jewish American'),
  ('Irish American'),
  ('Italian American'),
  ('Greek American'),
  ('Polish American'),
  ('German American'),
  ('French American'),
  ('Portuguese American'),
  ('Scandinavian American'),
  ('South Asian American'),
  ('East Asian American'),
  ('Southeast Asian American')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.event_types et
  WHERE et.parent_id = 728 AND et.name = v.name
);
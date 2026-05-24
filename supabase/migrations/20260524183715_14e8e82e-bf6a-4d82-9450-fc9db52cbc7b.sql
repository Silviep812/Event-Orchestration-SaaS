
INSERT INTO event_types (name, parent_id, theme_id) VALUES ('Heritage', NULL, 4);

INSERT INTO event_types (name, parent_id, theme_id)
SELECT v.name, (SELECT id FROM event_types WHERE name = 'Heritage' AND theme_id = 4 AND parent_id IS NULL LIMIT 1), 4
FROM (VALUES
  ('Cultural Heritage'),
  ('Family Heritage'),
  ('Community Heritage'),
  ('Historical Heritage'),
  ('Ethnic Heritage')
) AS v(name);

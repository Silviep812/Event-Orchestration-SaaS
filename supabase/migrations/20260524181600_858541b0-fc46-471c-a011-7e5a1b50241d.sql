-- 1. Strip "Celebration" tag from Festival theme so it no longer reads "Festival/Celebration"
UPDATE "Themes Directory Catalog"
SET tags = ARRAY['Cultural','Community']
WHERE id = 8;

-- 2. Add Cultural festival event types (parent_id 665, theme_id 8) — skip names already present
INSERT INTO event_types (name, parent_id, theme_id)
SELECT v.name, 665, 8
FROM (VALUES
  ('Music Festival'),
  ('Film Festival'),
  ('Food Festival'),
  ('Wine Festival'),
  ('Beer Festival'),
  ('Art Festival'),
  ('Dance Festival'),
  ('Jazz Festival'),
  ('Folk Festival'),
  ('Literary Festival'),
  ('Theater Festival'),
  ('Fashion Festival'),
  ('Heritage Festival'),
  ('Cultural Parade')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM event_types et
  WHERE et.parent_id = 665 AND et.name = v.name
);

-- 3. Add Community festival event types (parent_id 666, theme_id 8)
INSERT INTO event_types (name, parent_id, theme_id)
SELECT v.name, 666, 8
FROM (VALUES
  ('Block Party'),
  ('Street Fair'),
  ('County Fair'),
  ('Carnival'),
  ('Community Parade'),
  ('Community Picnic'),
  ('Pride Festival'),
  ('Harvest Festival'),
  ('Charity Festival'),
  ('Neighborhood Festival'),
  ('School Festival'),
  ('Town Fair'),
  ('Holiday Market Festival'),
  ('Winter Festival')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM event_types et
  WHERE et.parent_id = 666 AND et.name = v.name
);
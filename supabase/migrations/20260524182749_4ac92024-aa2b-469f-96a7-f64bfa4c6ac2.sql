-- 1. Promote existing rows to be the Family & School category parents under Reunion (theme_id=6)
UPDATE event_types SET name = 'Family', theme_id = 6, parent_id = NULL WHERE id = 83;
UPDATE event_types SET name = 'School', theme_id = 6, parent_id = NULL WHERE id = 82;

-- 2. Insert Family reunion types (parent_id 83)
INSERT INTO event_types (name, parent_id, theme_id)
SELECT v.name, 83, 6
FROM (VALUES
  ('Family Picnic'),
  ('Family BBQ'),
  ('Family Anniversary'),
  ('Holiday Family Gathering'),
  ('Multi-Generational Reunion'),
  ('Family Heritage Celebration'),
  ('Sibling Reunion'),
  ('Cousins Reunion'),
  ('Family Camping Trip'),
  ('Memorial Family Gathering')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM event_types et WHERE et.parent_id = 83 AND et.name = v.name);

-- 3. Insert School reunion types (parent_id 82)
INSERT INTO event_types (name, parent_id, theme_id)
SELECT v.name, 82, 6
FROM (VALUES
  ('Class Reunion'),
  ('High School Reunion'),
  ('College Reunion'),
  ('University Alumni Reunion'),
  ('Sorority Reunion'),
  ('Fraternity Reunion'),
  ('Sports Team Reunion'),
  ('Homecoming'),
  ('Decade Reunion'),
  ('Faculty Reunion')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM event_types et WHERE et.parent_id = 82 AND et.name = v.name);
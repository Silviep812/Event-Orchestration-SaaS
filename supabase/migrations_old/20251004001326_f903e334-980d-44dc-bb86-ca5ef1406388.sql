-- Add Inclusive group under Meetup theme
-- Insert the Inclusive parent group under Meetup theme
INSERT INTO event_types (name, theme_id, parent_id, created_at)
SELECT 'Inclusive', id, NULL, now()
FROM event_themes 
WHERE name = 'Meetup'
LIMIT 1;

-- Insert inclusive event types alphabetically
INSERT INTO event_types (name, theme_id, parent_id, created_at)
SELECT 
  event_type,
  (SELECT id FROM event_themes WHERE name = 'Meetup' LIMIT 1),
  (SELECT id FROM event_types WHERE name = 'Inclusive' AND theme_id = (SELECT id FROM event_themes WHERE name = 'Meetup' LIMIT 1) AND parent_id IS NULL LIMIT 1),
  now()
FROM (
  VALUES 
    ('Accessible Events Workshop'),
    ('All Abilities Social'),
    ('Cultural Exchange Meetup'),
    ('Disability Awareness Event'),
    ('Diversity Celebration'),
    ('Gender Inclusive Gathering'),
    ('Inclusive Business Network'),
    ('Inclusive Sports Event'),
    ('Interfaith Dialogue'),
    ('LGBTQ+ Support Group'),
    ('Mental Health Awareness Meetup'),
    ('Multicultural Festival'),
    ('Neurodiversity Meetup'),
    ('Senior & Youth Connection'),
    ('Special Needs Family Meetup'),
    ('Universal Design Workshop'),
    ('Veterans Support Group'),
    ('Wheelchair Accessible Social')
) AS types(event_type)
ORDER BY event_type;

-- Update Meetup theme to include Inclusive tag
UPDATE event_themes 
SET tags = array_append(COALESCE(tags, ARRAY[]::text[]), 'Inclusive')
WHERE name = 'Meetup' 
AND NOT ('Inclusive' = ANY(COALESCE(tags, ARRAY[]::text[])));
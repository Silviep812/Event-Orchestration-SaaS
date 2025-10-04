-- Add Community group under Meetup theme
-- First, get or confirm the Meetup theme exists and get its ID
-- Assuming Meetup theme has id 10 based on typical setup

-- Insert the Community parent group under Meetup theme
INSERT INTO event_types (name, theme_id, parent_id, created_at)
SELECT 'Community', id, NULL, now()
FROM event_themes 
WHERE name = 'Meetup'
LIMIT 1;

-- Insert community event types alphabetically
INSERT INTO event_types (name, theme_id, parent_id, created_at)
SELECT 
  event_type,
  (SELECT id FROM event_themes WHERE name = 'Meetup' LIMIT 1),
  (SELECT id FROM event_types WHERE name = 'Community' AND theme_id = (SELECT id FROM event_themes WHERE name = 'Meetup' LIMIT 1) AND parent_id IS NULL LIMIT 1),
  now()
FROM (
  VALUES 
    ('Block Party'),
    ('Book Club Gathering'),
    ('Community Cleanup Event'),
    ('Community Garden Meeting'),
    ('Community Potluck'),
    ('Farmers Market Meetup'),
    ('Homeowners Association Meeting'),
    ('Local Business Networking'),
    ('Neighborhood BBQ'),
    ('Neighborhood Watch Meeting'),
    ('Parent Teacher Association'),
    ('Pet Owners Meetup'),
    ('Public Forum'),
    ('School Board Meeting'),
    ('Senior Citizens Social'),
    ('Town Hall Meeting'),
    ('Volunteer Coordination'),
    ('Youth Group Gathering')
) AS types(event_type)
ORDER BY event_type;
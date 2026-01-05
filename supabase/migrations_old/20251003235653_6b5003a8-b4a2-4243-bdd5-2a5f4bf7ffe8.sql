-- Add Rejuvenating group under Health and Wellness theme
-- First, insert the Rejuvenating parent group
INSERT INTO event_types (name, theme_id, parent_id, created_at)
VALUES ('Rejuvenating', 2, 16, now());

-- Get the ID of the newly created Rejuvenating parent
-- Then insert rejuvenating event types alphabetically
INSERT INTO event_types (name, theme_id, parent_id, created_at)
SELECT 
  event_type,
  2,
  (SELECT id FROM event_types WHERE name = 'Rejuvenating' AND parent_id = 16 AND theme_id = 2),
  now()
FROM (
  VALUES 
    ('Aromatherapy Session'),
    ('Ayurvedic Retreat'),
    ('Beauty Treatment Day'),
    ('Body Scrub Workshop'),
    ('Detox Retreat'),
    ('Facial Treatment Session'),
    ('Hot Stone Massage Event'),
    ('Hydrotherapy Session'),
    ('Massage Therapy Workshop'),
    ('Mud Bath Experience'),
    ('Reflexology Session'),
    ('Reiki Healing Circle'),
    ('Salt Room Experience'),
    ('Sauna Gathering'),
    ('Spa Day Event'),
    ('Steam Bath Session'),
    ('Thai Massage Workshop'),
    ('Thermal Bath Experience'),
    ('Wellness Spa Retreat'),
    ('Yoga and Massage Combo')
) AS types(event_type)
ORDER BY event_type;
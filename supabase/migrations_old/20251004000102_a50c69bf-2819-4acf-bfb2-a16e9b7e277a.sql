-- Add Holistic group under Health and Wellness theme
-- First, insert the Holistic parent group
INSERT INTO event_types (name, theme_id, parent_id, created_at)
VALUES ('Holistic', 2, 16, now());

-- Get the ID of the newly created Holistic parent
-- Then insert holistic event types alphabetically
INSERT INTO event_types (name, theme_id, parent_id, created_at)
SELECT 
  event_type,
  2,
  (SELECT id FROM event_types WHERE name = 'Holistic' AND parent_id = 16 AND theme_id = 2),
  now()
FROM (
  VALUES 
    ('Acupuncture Session'),
    ('Alternative Medicine Workshop'),
    ('Breathwork Circle'),
    ('Chinese Medicine Seminar'),
    ('Chiropractic Wellness Day'),
    ('Crystal Healing Session'),
    ('Energy Healing Workshop'),
    ('Functional Medicine Retreat'),
    ('Herbal Medicine Workshop'),
    ('Holistic Health Fair'),
    ('Holistic Nutrition Seminar'),
    ('Homeopathy Workshop'),
    ('Integrative Medicine Conference'),
    ('Mind-Body Connection Workshop'),
    ('Naturopathic Consultation Event'),
    ('Natural Healing Retreat'),
    ('Preventive Health Workshop'),
    ('Sound Healing Session'),
    ('Traditional Chinese Medicine Event'),
    ('Wellness Assessment Day')
) AS types(event_type)
ORDER BY event_type;
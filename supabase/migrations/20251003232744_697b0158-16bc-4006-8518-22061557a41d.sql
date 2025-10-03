
-- Add Spiritual parent under Health & Wellness (parent_id = 16)
INSERT INTO event_types (name, parent_id, theme_id) 
VALUES ('Spiritual', 16, 2);

-- Add spiritual event subtypes alphabetically under Spiritual
INSERT INTO event_types (name, parent_id, theme_id) VALUES
('Baptism Ceremony', (SELECT id FROM event_types WHERE name = 'Spiritual' AND parent_id = 16), 2),
('Buddhist Meditation', (SELECT id FROM event_types WHERE name = 'Spiritual' AND parent_id = 16), 2),
('Chakra Balancing', (SELECT id FROM event_types WHERE name = 'Spiritual' AND parent_id = 16), 2),
('Christian Retreat', (SELECT id FROM event_types WHERE name = 'Spiritual' AND parent_id = 16), 2),
('Confirmation Service', (SELECT id FROM event_types WHERE name = 'Spiritual' AND parent_id = 16), 2),
('Energy Healing', (SELECT id FROM event_types WHERE name = 'Spiritual' AND parent_id = 16), 2),
('Faith Gathering', (SELECT id FROM event_types WHERE name = 'Spiritual' AND parent_id = 16), 2),
('Gospel Concert', (SELECT id FROM event_types WHERE name = 'Spiritual' AND parent_id = 16), 2),
('Hindu Puja', (SELECT id FROM event_types WHERE name = 'Spiritual' AND parent_id = 16), 2),
('Interfaith Service', (SELECT id FROM event_types WHERE name = 'Spiritual' AND parent_id = 16), 2),
('Jewish Shabbat', (SELECT id FROM event_types WHERE name = 'Spiritual' AND parent_id = 16), 2),
('Kirtan Chanting', (SELECT id FROM event_types WHERE name = 'Spiritual' AND parent_id = 16), 2),
('Labyrinth Walk', (SELECT id FROM event_types WHERE name = 'Spiritual' AND parent_id = 16), 2),
('Meditation Circle', (SELECT id FROM event_types WHERE name = 'Spiritual' AND parent_id = 16), 2),
('Mindful Prayer', (SELECT id FROM event_types WHERE name = 'Spiritual' AND parent_id = 16), 2),
('Prayer Service', (SELECT id FROM event_types WHERE name = 'Spiritual' AND parent_id = 16), 2),
('Reiki Session', (SELECT id FROM event_types WHERE name = 'Spiritual' AND parent_id = 16), 2),
('Sacred Ceremony', (SELECT id FROM event_types WHERE name = 'Spiritual' AND parent_id = 16), 2),
('Spiritual Workshop', (SELECT id FROM event_types WHERE name = 'Spiritual' AND parent_id = 16), 2),
('Vipassana Meditation', (SELECT id FROM event_types WHERE name = 'Spiritual' AND parent_id = 16), 2),
('Worship Service', (SELECT id FROM event_types WHERE name = 'Spiritual' AND parent_id = 16), 2);

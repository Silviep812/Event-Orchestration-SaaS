
-- Add Peaceful parent under Health & Wellness
INSERT INTO event_types (name, parent_id, theme_id) 
VALUES ('Peaceful', 16, 2);

-- Get the ID of the newly created Peaceful parent
-- Add peaceful event subtypes alphabetically under Peaceful
INSERT INTO event_types (name, parent_id, theme_id) VALUES
('Aromatherapy Session', (SELECT id FROM event_types WHERE name = 'Peaceful' AND parent_id = 16), 2),
('Breathwork Circle', (SELECT id FROM event_types WHERE name = 'Peaceful' AND parent_id = 16), 2),
('Candlelight Meditation', (SELECT id FROM event_types WHERE name = 'Peaceful' AND parent_id = 16), 2),
('Forest Bathing', (SELECT id FROM event_types WHERE name = 'Peaceful' AND parent_id = 16), 2),
('Garden Meditation', (SELECT id FROM event_types WHERE name = 'Peaceful' AND parent_id = 16), 2),
('Guided Relaxation', (SELECT id FROM event_types WHERE name = 'Peaceful' AND parent_id = 16), 2),
('Healing Circle', (SELECT id FROM event_types WHERE name = 'Peaceful' AND parent_id = 16), 2),
('Lakeside Retreat', (SELECT id FROM event_types WHERE name = 'Peaceful' AND parent_id = 16), 2),
('Massage Retreat', (SELECT id FROM event_types WHERE name = 'Peaceful' AND parent_id = 16), 2),
('Mindfulness Workshop', (SELECT id FROM event_types WHERE name = 'Peaceful' AND parent_id = 16), 2),
('Nature Walk', (SELECT id FROM event_types WHERE name = 'Peaceful' AND parent_id = 16), 2),
('Quiet Contemplation', (SELECT id FROM event_types WHERE name = 'Peaceful' AND parent_id = 16), 2),
('Reflection Retreat', (SELECT id FROM event_types WHERE name = 'Peaceful' AND parent_id = 16), 2),
('Restorative Yoga', (SELECT id FROM event_types WHERE name = 'Peaceful' AND parent_id = 16), 2),
('Silent Meditation', (SELECT id FROM event_types WHERE name = 'Peaceful' AND parent_id = 16), 2),
('Sound Bath', (SELECT id FROM event_types WHERE name = 'Peaceful' AND parent_id = 16), 2),
('Tai Chi Class', (SELECT id FROM event_types WHERE name = 'Peaceful' AND parent_id = 16), 2),
('Tranquility Retreat', (SELECT id FROM event_types WHERE name = 'Peaceful' AND parent_id = 16), 2),
('Wellness Spa Day', (SELECT id FROM event_types WHERE name = 'Peaceful' AND parent_id = 16), 2),
('Yoga Nidra Session', (SELECT id FROM event_types WHERE name = 'Peaceful' AND parent_id = 16), 2),
('Zen Garden Experience', (SELECT id FROM event_types WHERE name = 'Peaceful' AND parent_id = 16), 2);

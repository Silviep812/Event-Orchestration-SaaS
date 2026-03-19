-- Add Wellness and Mindfulness tags to Health and Wellness theme
UPDATE event_themes 
SET tags = ARRAY['Peaceful', 'Spiritual', 'Rejuvenating', 'Holistic', 'Wellness', 'Mindfulness']
WHERE id = 8 AND name = 'Health and Wellness';

-- Add Wellness group under Health & Wellness (parent_id=16, theme_id=8)
INSERT INTO event_types (name, parent_id, theme_id) VALUES
('Wellness', 16, 8);

-- Add Mindfulness group under Health & Wellness (parent_id=16, theme_id=8)
INSERT INTO event_types (name, parent_id, theme_id) VALUES
('Mindfulness', 16, 8);

-- Add child types under Wellness
INSERT INTO event_types (name, parent_id, theme_id)
SELECT child_name, w.id, 8
FROM event_types w,
(VALUES ('Fitness Retreats'), ('Nutrition Workshops'), ('Spa Days'), ('Wellness Coaching'), ('Health Screenings'), ('Self-Care Events')) AS children(child_name)
WHERE w.name = 'Wellness' AND w.parent_id = 16 AND w.theme_id = 8;

-- Add child types under Mindfulness
INSERT INTO event_types (name, parent_id, theme_id)
SELECT child_name, m.id, 8
FROM event_types m,
(VALUES ('Meditation Sessions'), ('Breathwork Classes'), ('Mindful Movement'), ('Journaling Workshops'), ('Sound Healing'), ('Stress Management')) AS children(child_name)
WHERE m.name = 'Mindfulness' AND m.parent_id = 16 AND m.theme_id = 8;
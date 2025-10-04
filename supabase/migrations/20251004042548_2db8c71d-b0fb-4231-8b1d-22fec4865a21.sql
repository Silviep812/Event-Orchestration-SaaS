
-- Add Kwanzaa to Celebration/Personal
INSERT INTO event_types (name, theme_id, parent_id)
VALUES ('Kwanzaa', 3, 3)
ON CONFLICT DO NOTHING;

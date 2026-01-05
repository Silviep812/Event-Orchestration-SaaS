-- Add Party as an event type for Celebration theme
INSERT INTO event_types (name, theme_id) 
VALUES ('Party', 3)
ON CONFLICT DO NOTHING;
-- Add missing event_types for Celebration theme personal events
-- Theme ID 3 is Celebration theme

INSERT INTO event_types (name, theme_id) VALUES
  ('Anniversary', 3),
  ('Birthday', 3),
  ('Barmitzvah', 3),
  ('Batmitzvah', 3),
  ('Engagement Party', 3),
  ('Family Reunion', 3),
  ('Gender Reveal', 3),
  ('Graduation Party', 3),
  ('Retirement Party', 3)
ON CONFLICT DO NOTHING;

-- Note: Baby Shower already exists, so it will be skipped by ON CONFLICT
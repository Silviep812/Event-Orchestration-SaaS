-- Add VanLife and Online Dating meetup types to event_types table
-- VanLife goes under Community (id: 302)
INSERT INTO event_types (name, parent_id, theme_id)
VALUES 
  ('VanLife Meetup', 302, 1),
  ('Online Dating Meetup', 302, 1);
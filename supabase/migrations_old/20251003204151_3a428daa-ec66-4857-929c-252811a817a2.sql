-- Add community group event types under Community (id=9)
INSERT INTO public.event_types (name, parent_id, theme_id, created_at)
VALUES 
  ('Alumni Association', 9, 4, now()),
  ('Book Club', 9, 4, now()),
  ('Chamber of Commerce', 9, 4, now()),
  ('Civic Organization', 9, 4, now()),
  ('Community Center', 9, 4, now()),
  ('Faith Community', 9, 4, now()),
  ('Homeowners Association', 9, 4, now()),
  ('Labor Union', 9, 4, now()),
  ('Neighborhood Association', 9, 4, now()),
  ('Parent-Teacher Association', 9, 4, now()),
  ('Professional Association', 9, 4, now()),
  ('Rotary Club', 9, 4, now()),
  ('Service Club', 9, 4, now()),
  ('Social Club', 9, 4, now()),
  ('Veterans Organization', 9, 4, now()),
  ('Volunteer Group', 9, 4, now()),
  ('Youth Group', 9, 4, now());
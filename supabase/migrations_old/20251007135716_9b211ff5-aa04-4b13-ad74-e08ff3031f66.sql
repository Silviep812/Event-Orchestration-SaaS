-- First insert entries into Authorization table to satisfy foreign key
INSERT INTO public."Authorization" (sign_in)
VALUES 
  ('Host'),
  ('Organizer'),
  ('Professional Event Planner'),
  ('Venue Owner'),
  ('Manager');

-- Then insert user type entries into User table
INSERT INTO public."User" (userid, user_name, contact_name, user_role)
VALUES 
  (gen_random_uuid(), 'Host', 'Host User', 'host'),
  (gen_random_uuid(), 'Organizer', 'Organizer User', 'organizer'),
  (gen_random_uuid(), 'Professional Event Planner', 'Professional Event Planner User', 'professional-planner'),
  (gen_random_uuid(), 'Venue Owner', 'Venue Owner User', 'venue-owner'),
  (gen_random_uuid(), 'Manager', 'Manager User', 'manager');
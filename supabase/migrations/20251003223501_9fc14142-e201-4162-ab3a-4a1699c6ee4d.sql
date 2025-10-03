-- First, check if Fine Dining parent already exists, if not create it
-- If it exists, we'll just add the child types
DO $$
DECLARE
  fine_dining_parent_id INT;
BEGIN
  -- Try to find existing Fine Dining parent
  SELECT id INTO fine_dining_parent_id
  FROM event_types
  WHERE name = 'Fine Dining' AND theme_id = 7 AND parent_id IS NULL;
  
  -- If not found, create it
  IF fine_dining_parent_id IS NULL THEN
    INSERT INTO event_types (name, theme_id, parent_id)
    VALUES ('Fine Dining', 7, NULL)
    RETURNING id INTO fine_dining_parent_id;
  END IF;
  
  -- Now insert all fine dining types alphabetically
  INSERT INTO event_types (name, theme_id, parent_id)
  VALUES 
    ('Bistro Fine Dining', 7, fine_dining_parent_id),
    ('Contemporary Fine Dining', 7, fine_dining_parent_id),
    ('French Cuisine', 7, fine_dining_parent_id),
    ('Fusion Fine Dining', 7, fine_dining_parent_id),
    ('Gourmet Dining', 7, fine_dining_parent_id),
    ('High-End Steakhouse', 7, fine_dining_parent_id),
    ('Italian Fine Dining', 7, fine_dining_parent_id),
    ('Japanese Kaiseki', 7, fine_dining_parent_id),
    ('Michelin-Star Restaurant', 7, fine_dining_parent_id),
    ('Modern American Fine Dining', 7, fine_dining_parent_id),
    ('Molecular Gastronomy', 7, fine_dining_parent_id),
    ('Omakase Experience', 7, fine_dining_parent_id),
    ('Private Chef Experience', 7, fine_dining_parent_id),
    ('Progressive Tasting Menu', 7, fine_dining_parent_id),
    ('Seafood Fine Dining', 7, fine_dining_parent_id),
    ('Wine Pairing Dinner', 7, fine_dining_parent_id)
  ON CONFLICT DO NOTHING;
END $$;
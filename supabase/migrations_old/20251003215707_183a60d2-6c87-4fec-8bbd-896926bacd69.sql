-- Create Contemporary parent event type under Dining theme (theme_id = 7)
INSERT INTO event_types (name, theme_id, parent_id) 
VALUES ('Contemporary', 7, NULL);

-- Get the id of the Contemporary parent we just created
DO $$
DECLARE
  contemporary_parent_id INTEGER;
BEGIN
  SELECT id INTO contemporary_parent_id 
  FROM event_types 
  WHERE name = 'Contemporary' AND theme_id = 7;

  -- Insert contemporary dining sub-types alphabetically
  INSERT INTO event_types (name, theme_id, parent_id) VALUES
    ('Asian Fusion', 7, contemporary_parent_id),
    ('Bistro', 7, contemporary_parent_id),
    ('Brunch', 7, contemporary_parent_id),
    ('Casual Dining', 7, contemporary_parent_id),
    ('Comfort Food', 7, contemporary_parent_id),
    ('Craft Cocktail', 7, contemporary_parent_id),
    ('Farm-to-Table', 7, contemporary_parent_id),
    ('Gastropub', 7, contemporary_parent_id),
    ('Mediterranean', 7, contemporary_parent_id),
    ('Modern American', 7, contemporary_parent_id),
    ('New American', 7, contemporary_parent_id),
    ('Organic', 7, contemporary_parent_id),
    ('Plant-Based', 7, contemporary_parent_id),
    ('Seasonal Menu', 7, contemporary_parent_id),
    ('Small Plates', 7, contemporary_parent_id),
    ('Tapas', 7, contemporary_parent_id),
    ('Wine Bar', 7, contemporary_parent_id);
END $$;
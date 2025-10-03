-- Add Buffet parent event type under Dining theme
INSERT INTO event_types (name, theme_id, parent_id)
VALUES ('Buffet', 7, NULL);

-- Get the ID of the Buffet parent type we just created
DO $$
DECLARE
  buffet_parent_id INTEGER;
BEGIN
  SELECT id INTO buffet_parent_id FROM event_types WHERE name = 'Buffet' AND theme_id = 7 AND parent_id IS NULL;
  
  -- Insert buffet sub-types alphabetically
  INSERT INTO event_types (name, theme_id, parent_id) VALUES
    ('All-You-Can-Eat', 7, buffet_parent_id),
    ('Breakfast Buffet', 7, buffet_parent_id),
    ('Brunch Buffet', 7, buffet_parent_id),
    ('Carving Station', 7, buffet_parent_id),
    ('Dessert Buffet', 7, buffet_parent_id),
    ('Dinner Buffet', 7, buffet_parent_id),
    ('Hot & Cold Buffet', 7, buffet_parent_id),
    ('International Buffet', 7, buffet_parent_id),
    ('Lunch Buffet', 7, buffet_parent_id),
    ('Salad Bar', 7, buffet_parent_id),
    ('Seafood Buffet', 7, buffet_parent_id),
    ('Self-Service', 7, buffet_parent_id),
    ('Station Buffet', 7, buffet_parent_id),
    ('Themed Buffet', 7, buffet_parent_id);
END $$;
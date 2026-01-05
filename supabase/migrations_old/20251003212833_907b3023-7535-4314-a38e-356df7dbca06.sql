-- Add Food parent event type under Marketplace theme
INSERT INTO public.event_types (name, theme_id, parent_id)
VALUES ('Food', 11, NULL);

-- Get the Food parent event type id
DO $$
DECLARE
  food_parent_id INTEGER;
BEGIN
  SELECT id INTO food_parent_id FROM public.event_types WHERE name = 'Food' AND theme_id = 11;
  
  -- Add food vendor types as children of Food parent
  INSERT INTO public.event_types (name, parent_id) VALUES
    ('Bakery', food_parent_id),
    ('BBQ/Grill', food_parent_id),
    ('Beverage Bar', food_parent_id),
    ('Catering Service', food_parent_id),
    ('Coffee/Tea Shop', food_parent_id),
    ('Confectionery', food_parent_id),
    ('Deli', food_parent_id),
    ('Dessert Bar', food_parent_id),
    ('Food Truck', food_parent_id),
    ('Ice Cream/Gelato', food_parent_id),
    ('Juice Bar', food_parent_id),
    ('Pizza', food_parent_id),
    ('Seafood', food_parent_id),
    ('Specialty Foods', food_parent_id),
    ('Street Food', food_parent_id),
    ('Sushi Bar', food_parent_id);
END $$;
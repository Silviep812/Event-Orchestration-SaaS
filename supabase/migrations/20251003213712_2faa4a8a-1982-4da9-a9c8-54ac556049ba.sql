-- Add Vintage parent event type under Marketplace theme
INSERT INTO public.event_types (name, theme_id, parent_id)
VALUES ('Vintage', 11, NULL);

-- Get the Vintage parent event type id
DO $$
DECLARE
  vintage_parent_id INTEGER;
BEGIN
  SELECT id INTO vintage_parent_id FROM public.event_types WHERE name = 'Vintage' AND theme_id = 11;
  
  -- Add vintage types as children of Vintage parent
  INSERT INTO public.event_types (name, parent_id) VALUES
    ('Antique Furniture', vintage_parent_id),
    ('Collectibles', vintage_parent_id),
    ('Estate Items', vintage_parent_id),
    ('Retro Fashion', vintage_parent_id),
    ('Vintage Books', vintage_parent_id),
    ('Vintage Cameras', vintage_parent_id),
    ('Vintage Clothing', vintage_parent_id),
    ('Vintage Décor', vintage_parent_id),
    ('Vintage Electronics', vintage_parent_id),
    ('Vintage Jewelry', vintage_parent_id),
    ('Vintage Kitchenware', vintage_parent_id),
    ('Vintage Records', vintage_parent_id),
    ('Vintage Textiles', vintage_parent_id),
    ('Vintage Toys', vintage_parent_id),
    ('Vintage Watches', vintage_parent_id);
END $$;
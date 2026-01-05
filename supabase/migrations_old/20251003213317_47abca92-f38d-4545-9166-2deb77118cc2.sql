-- Add Vendors parent event type under Marketplace theme
INSERT INTO public.event_types (name, theme_id, parent_id)
VALUES ('Vendors', 11, NULL);

-- Get the Vendors parent event type id
DO $$
DECLARE
  vendors_parent_id INTEGER;
BEGIN
  SELECT id INTO vendors_parent_id FROM public.event_types WHERE name = 'Vendors' AND theme_id = 11;
  
  -- Add vendor types as children of Vendors parent
  INSERT INTO public.event_types (name, parent_id) VALUES
    ('Apparel & Accessories', vendors_parent_id),
    ('Art & Craft Supplies', vendors_parent_id),
    ('Books & Media', vendors_parent_id),
    ('Electronics', vendors_parent_id),
    ('Fitness & Sports', vendors_parent_id),
    ('Flowers & Plants', vendors_parent_id),
    ('Food & Beverage', vendors_parent_id),
    ('Health & Beauty', vendors_parent_id),
    ('Home & Garden', vendors_parent_id),
    ('Jewelry & Watches', vendors_parent_id),
    ('Pet Supplies', vendors_parent_id),
    ('Photography', vendors_parent_id),
    ('Stationery & Office', vendors_parent_id),
    ('Toys & Games', vendors_parent_id),
    ('Vintage & Antiques', vendors_parent_id);
END $$;
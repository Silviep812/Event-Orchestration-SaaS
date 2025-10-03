-- Create parent Artisans event type under Marketplace theme
INSERT INTO event_types (name, theme_id, parent_id, created_at)
VALUES ('Artisans', 11, NULL, now());

-- Get the id of the Artisans parent we just created
DO $$
DECLARE
  artisans_parent_id INTEGER;
BEGIN
  SELECT id INTO artisans_parent_id FROM event_types WHERE name = 'Artisans' AND theme_id = 11;
  
  -- Create specific artisan types as children, organized alphabetically
  INSERT INTO event_types (name, theme_id, parent_id, created_at) VALUES
    ('Blacksmith', 11, artisans_parent_id, now()),
    ('Candle Maker', 11, artisans_parent_id, now()),
    ('Carpenter', 11, artisans_parent_id, now()),
    ('Ceramic Artist', 11, artisans_parent_id, now()),
    ('Fiber Artist', 11, artisans_parent_id, now()),
    ('Glassblower', 11, artisans_parent_id, now()),
    ('Jeweler', 11, artisans_parent_id, now()),
    ('Leather Crafter', 11, artisans_parent_id, now()),
    ('Metalworker', 11, artisans_parent_id, now()),
    ('Painter', 11, artisans_parent_id, now()),
    ('Potter', 11, artisans_parent_id, now()),
    ('Printmaker', 11, artisans_parent_id, now()),
    ('Sculptor', 11, artisans_parent_id, now()),
    ('Soap Maker', 11, artisans_parent_id, now()),
    ('Textile Artist', 11, artisans_parent_id, now()),
    ('Woodworker', 11, artisans_parent_id, now());
END $$;
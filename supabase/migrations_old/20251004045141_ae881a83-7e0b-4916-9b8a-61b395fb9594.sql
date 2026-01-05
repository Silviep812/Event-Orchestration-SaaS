-- Update Festival theme categories to Cultural and Community
-- First, get the theme_id for Festival
DO $$
DECLARE
  festival_theme_id INTEGER;
  cultural_id INTEGER;
  community_id INTEGER;
BEGIN
  -- Get Festival theme ID
  SELECT id INTO festival_theme_id FROM event_themes WHERE name = 'Festival' LIMIT 1;
  
  IF festival_theme_id IS NOT NULL THEN
    -- Delete old parent categories (Annual, Arts) for Festival theme
    DELETE FROM event_types 
    WHERE theme_id = festival_theme_id 
      AND parent_id IS NULL 
      AND name IN ('Annual', 'Arts');
    
    -- Update or insert Cultural category
    INSERT INTO event_types (name, theme_id, parent_id, created_at)
    VALUES ('Cultural', festival_theme_id, NULL, now())
    ON CONFLICT DO NOTHING
    RETURNING id INTO cultural_id;
    
    -- Update or insert Community category
    INSERT INTO event_types (name, theme_id, parent_id, created_at)
    VALUES ('Community', festival_theme_id, NULL, now())
    ON CONFLICT DO NOTHING
    RETURNING id INTO community_id;
    
    -- If Cultural or Community already existed, get their IDs
    IF cultural_id IS NULL THEN
      SELECT id INTO cultural_id FROM event_types 
      WHERE name = 'Cultural' AND theme_id = festival_theme_id AND parent_id IS NULL;
    END IF;
    
    IF community_id IS NULL THEN
      SELECT id INTO community_id FROM event_types 
      WHERE name = 'Community' AND theme_id = festival_theme_id AND parent_id IS NULL;
    END IF;
  END IF;
END $$;
-- Remove duplicate Festival categories
-- Keep the older entries (lower IDs) and remove the newer duplicates

-- First, check if there are any child event_types pointing to the duplicates
-- If so, update them to point to the original parent IDs
DO $$
DECLARE
  festival_theme_id INTEGER;
BEGIN
  -- Get Festival theme ID
  SELECT id INTO festival_theme_id FROM event_themes WHERE name = 'Festival' LIMIT 1;
  
  IF festival_theme_id IS NOT NULL THEN
    -- Update any child event_types that point to duplicate Cultural (341) to point to original (8)
    UPDATE event_types 
    SET parent_id = 8 
    WHERE parent_id = 341 AND theme_id = festival_theme_id;
    
    -- Update any child event_types that point to duplicate Community (342) to point to original (9)
    UPDATE event_types 
    SET parent_id = 9 
    WHERE parent_id = 342 AND theme_id = festival_theme_id;
    
    -- Delete the duplicate entries
    DELETE FROM event_types 
    WHERE theme_id = festival_theme_id 
      AND parent_id IS NULL 
      AND id IN (341, 342);
  END IF;
END $$;
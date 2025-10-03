-- Insert American cultural group entries under Festival/Cultural in alphabetical order
-- First, get the Cultural event type ID (child of Festival)
DO $$
DECLARE
  cultural_id INTEGER;
  festival_theme_id INTEGER;
BEGIN
  -- Get the Festival theme ID (theme_id = 4 based on previous context)
  festival_theme_id := 4;
  
  -- Get the Cultural event type ID
  SELECT id INTO cultural_id
  FROM public.event_types
  WHERE name = 'Cultural' AND theme_id = festival_theme_id;
  
  -- If Cultural doesn't exist, create it first
  IF cultural_id IS NULL THEN
    INSERT INTO public.event_types (name, theme_id, parent_id)
    SELECT 'Cultural', festival_theme_id, id
    FROM public.event_types
    WHERE name = 'Festival' AND theme_id = festival_theme_id AND parent_id IS NULL
    RETURNING id INTO cultural_id;
  END IF;
  
  -- Insert American cultural groups in alphabetical order
  INSERT INTO public.event_types (name, theme_id, parent_id)
  VALUES
    ('African American', festival_theme_id, cultural_id),
    ('Asian American', festival_theme_id, cultural_id),
    ('Caribbean American', festival_theme_id, cultural_id),
    ('Eastern European American', festival_theme_id, cultural_id),
    ('Hispanic/Latino American', festival_theme_id, cultural_id),
    ('Irish American', festival_theme_id, cultural_id),
    ('Italian American', festival_theme_id, cultural_id),
    ('Jewish American', festival_theme_id, cultural_id),
    ('Middle Eastern American', festival_theme_id, cultural_id),
    ('Native American/Indigenous', festival_theme_id, cultural_id),
    ('Pacific Islander American', festival_theme_id, cultural_id),
    ('Polish American', festival_theme_id, cultural_id),
    ('Scandinavian American', festival_theme_id, cultural_id),
    ('Scottish American', festival_theme_id, cultural_id),
    ('South Asian American', festival_theme_id, cultural_id)
  ON CONFLICT DO NOTHING;
END $$;
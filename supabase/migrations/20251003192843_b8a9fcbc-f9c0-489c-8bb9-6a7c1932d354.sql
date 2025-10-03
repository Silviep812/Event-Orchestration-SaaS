-- Add parent_id column to support hierarchical event types
ALTER TABLE event_types ADD COLUMN IF NOT EXISTS parent_id integer REFERENCES event_types(id) ON DELETE CASCADE;

-- First, ensure we have Holidays and Personal as the two main categories
-- Update existing "Holidays" and "Personal" to be parent categories (no parent_id)
UPDATE event_types SET parent_id = NULL WHERE name IN ('Holidays', 'Personal') AND theme_id = 3;

-- Get the IDs for Personal and Holidays
DO $$
DECLARE
  personal_id integer;
  holidays_id integer;
BEGIN
  SELECT id INTO personal_id FROM event_types WHERE name = 'Personal' AND theme_id = 3;
  SELECT id INTO holidays_id FROM event_types WHERE name = 'Holidays' AND theme_id = 3;
  
  -- Make all the personal celebration types children of Personal
  UPDATE event_types 
  SET parent_id = personal_id 
  WHERE name IN (
    'Anniversary', 'Baby Shower', 'Barmitzvah', 'Batmitzvah', 
    'Birthday', 'Engagement Party', 'Family Reunion', 
    'Gender Reveal', 'Graduation Party', 'Party', 'Retirement Party'
  ) AND theme_id = 3;
  
  -- Add common US national holidays as children of Holidays
  INSERT INTO event_types (name, theme_id, parent_id) VALUES
    ('New Year''s Day', 3, holidays_id),
    ('Martin Luther King Jr. Day', 3, holidays_id),
    ('Presidents'' Day', 3, holidays_id),
    ('Memorial Day', 3, holidays_id),
    ('Independence Day', 3, holidays_id),
    ('Labor Day', 3, holidays_id),
    ('Thanksgiving', 3, holidays_id),
    ('Christmas', 3, holidays_id),
    ('Easter', 3, holidays_id),
    ('Halloween', 3, holidays_id),
    ('Valentine''s Day', 3, holidays_id)
  ON CONFLICT DO NOTHING;
END $$;
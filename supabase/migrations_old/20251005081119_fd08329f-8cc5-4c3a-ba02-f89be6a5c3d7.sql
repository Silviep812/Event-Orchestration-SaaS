-- Add description column to suppliers table
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS description TEXT;

-- Insert Crestline supplier under "Other" category
INSERT INTO suppliers (business_name, category_id, description)
VALUES ('Crestline', 5, 'Unique giveaways for Event Planners');
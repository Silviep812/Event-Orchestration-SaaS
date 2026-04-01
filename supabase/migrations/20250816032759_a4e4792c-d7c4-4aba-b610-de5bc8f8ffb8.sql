-- Enable public access to Themes Directory since it's reference data
DROP POLICY IF EXISTS "Anyone can view themes directory" ON "Themes Directory";
CREATE POLICY "Anyone can view themes directory"
ON "Themes Directory"
FOR SELECT
USING (true);

-- Insert a sample row if the table is empty (since it appears to be a single-row reference table)
INSERT INTO "Themes Directory" (
  baby_shower, bridal_shower, "Celebration", "Dining", "Festival", 
  wedding, retreats, reunion
) VALUES (
  'Baby Shower Theme', 'Bridal Shower Theme', 'Celebration Theme', 
  'Dining Theme', 'Festival Theme', 'Wedding Theme', 
  'Retreat Theme', 'Reunion Theme'
) ON CONFLICT DO NOTHING;
-- Update Dining theme tags
UPDATE event_themes 
SET tags = ARRAY['Contemporary', 'Buffet', 'Farm-Table', 'Fine Dining']
WHERE name = 'Dining';
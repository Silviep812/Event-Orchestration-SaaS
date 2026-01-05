-- Remove 'Farm-Table' from the Dining theme tags
UPDATE event_themes 
SET tags = array_remove(tags, 'Farm-Table')
WHERE name = 'Dining' AND id = 7;
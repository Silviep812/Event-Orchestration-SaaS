-- Remove duplicate Buffet entry (keeping the one with id: 39 that has the child types)
DELETE FROM event_types 
WHERE name = 'Buffet' 
AND theme_id = 7 
AND id = 184;
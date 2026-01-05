-- Update the existing organizer role to be global instead of event-specific
UPDATE user_roles 
SET event_id = NULL 
WHERE id = 'a11e96ef-db42-483a-99aa-0b1c05692e08';
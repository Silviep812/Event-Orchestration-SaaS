-- Update task titles for Lee's Event Collaborator tasks
UPDATE tasks 
SET title = 'Lee''s Event Collaborator - Venue', updated_at = now()
WHERE id = '277467f2-4e04-44d9-96c6-9e3a95dbf592';

UPDATE tasks 
SET title = 'Lee''s Event Collaborator - Bookings', updated_at = now()
WHERE id = '312899a4-f355-4363-9969-af5bffac9a2f';

UPDATE tasks 
SET title = 'Lee''s Event Collaborator - Service Vendor', updated_at = now()
WHERE id = '3185c8a2-3cc0-4cde-b463-276db81c9bd0';
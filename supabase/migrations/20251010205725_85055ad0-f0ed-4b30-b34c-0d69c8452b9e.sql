-- Delete user_roles for specific users
DELETE FROM public.user_roles
WHERE id IN (
  'd247d4ab-1c38-4dce-8c25-774a04d7d089',
  'e34b345a-dd60-451d-8c6a-b775c8abb7c4',
  '69b9a10e-a37a-4663-9be3-cdba6fbb0821'
);
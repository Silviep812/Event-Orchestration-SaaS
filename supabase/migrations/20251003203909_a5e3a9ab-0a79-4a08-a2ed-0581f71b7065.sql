-- Add community group event types under Festival/Community
INSERT INTO public.event_types (name, parent_id, theme_id, created_at)
SELECT 
  group_name,
  et.id,
  et.theme_id,
  now()
FROM public.event_types et
CROSS JOIN (
  VALUES 
    ('Alumni Association'),
    ('Book Club'),
    ('Chamber of Commerce'),
    ('Civic Organization'),
    ('Community Center'),
    ('Faith Community'),
    ('Homeowners Association'),
    ('Labor Union'),
    ('Neighborhood Association'),
    ('Parent-Teacher Association'),
    ('Professional Association'),
    ('Rotary Club'),
    ('Service Club'),
    ('Social Club'),
    ('Veterans Organization'),
    ('Volunteer Group'),
    ('Youth Group')
) AS groups(group_name)
WHERE et.name = 'Community'
  AND et.parent_id = (SELECT id FROM public.event_types WHERE name = 'Festival' AND parent_id IS NULL)
ORDER BY group_name;
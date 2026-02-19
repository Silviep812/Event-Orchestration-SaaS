-- Add permission group mappings for new roles
INSERT INTO public.role_permission_groups (role, permission_group)
VALUES 
  ('partner', 'coordinator'),
  ('sponsor', 'viewer'),
  ('stakeholder', 'viewer'),
  ('venue_manager', 'coordinator')
ON CONFLICT DO NOTHING;
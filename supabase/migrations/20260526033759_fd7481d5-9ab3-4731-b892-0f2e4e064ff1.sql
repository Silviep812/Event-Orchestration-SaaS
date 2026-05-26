INSERT INTO public.role_permission_groups(role, permission_group)
VALUES ('tester','admin')
ON CONFLICT (role) DO UPDATE SET permission_group = EXCLUDED.permission_group;
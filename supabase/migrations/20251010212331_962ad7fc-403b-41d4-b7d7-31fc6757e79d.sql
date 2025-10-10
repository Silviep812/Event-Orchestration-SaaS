
-- Remove all entries for the specified users
-- User IDs to remove:
-- 2480bdd6-ded5-48ab-97b2-47fa094175d6 (andrezafeu+viewer_001@gmail.com)
-- 4c042be6-3030-4a72-adc9-5d1e6ee8ca7c (andrezafeu+magic_link@gmail.com)
-- e0340bb9-a3a0-40cd-b3b7-77a6da702181 (andrezafeu+no_team_001@gmail.com)

-- Temporarily disable triggers to avoid conflicts
ALTER TABLE public.tasks DISABLE TRIGGER log_task_changes_trigger;
ALTER TABLE public.budget_items DISABLE TRIGGER log_budget_item_changes_trigger;

-- Delete from workflows
DELETE FROM public.workflows 
WHERE user_id IN (
  '2480bdd6-ded5-48ab-97b2-47fa094175d6',
  '4c042be6-3030-4a72-adc9-5d1e6ee8ca7c',
  'e0340bb9-a3a0-40cd-b3b7-77a6da702181'
);

-- Delete from team_assignments
DELETE FROM public.team_assignments 
WHERE user_id IN (
  '2480bdd6-ded5-48ab-97b2-47fa094175d6',
  '4c042be6-3030-4a72-adc9-5d1e6ee8ca7c',
  'e0340bb9-a3a0-40cd-b3b7-77a6da702181'
);

-- Delete from tasks (as assigned user or creator)
DELETE FROM public.tasks 
WHERE assigned_to IN (
  '2480bdd6-ded5-48ab-97b2-47fa094175d6',
  '4c042be6-3030-4a72-adc9-5d1e6ee8ca7c',
  'e0340bb9-a3a0-40cd-b3b7-77a6da702181'
) OR created_by IN (
  '2480bdd6-ded5-48ab-97b2-47fa094175d6',
  '4c042be6-3030-4a72-adc9-5d1e6ee8ca7c',
  'e0340bb9-a3a0-40cd-b3b7-77a6da702181'
);

-- Delete from budget_items
DELETE FROM public.budget_items 
WHERE created_by IN (
  '2480bdd6-ded5-48ab-97b2-47fa094175d6',
  '4c042be6-3030-4a72-adc9-5d1e6ee8ca7c',
  'e0340bb9-a3a0-40cd-b3b7-77a6da702181'
);

-- Re-enable triggers
ALTER TABLE public.tasks ENABLE TRIGGER log_task_changes_trigger;
ALTER TABLE public.budget_items ENABLE TRIGGER log_budget_item_changes_trigger;

-- Delete from profiles
DELETE FROM public.profiles 
WHERE user_id IN (
  '2480bdd6-ded5-48ab-97b2-47fa094175d6',
  '4c042be6-3030-4a72-adc9-5d1e6ee8ca7c',
  'e0340bb9-a3a0-40cd-b3b7-77a6da702181'
);

-- Delete from user_roles
DELETE FROM public.user_roles 
WHERE user_id IN (
  '2480bdd6-ded5-48ab-97b2-47fa094175d6',
  '4c042be6-3030-4a72-adc9-5d1e6ee8ca7c',
  'e0340bb9-a3a0-40cd-b3b7-77a6da702181'
);

-- Delete from auth.users (this will cascade to any other related records)
DELETE FROM auth.users 
WHERE id IN (
  '2480bdd6-ded5-48ab-97b2-47fa094175d6',
  '4c042be6-3030-4a72-adc9-5d1e6ee8ca7c',
  'e0340bb9-a3a0-40cd-b3b7-77a6da702181'
);

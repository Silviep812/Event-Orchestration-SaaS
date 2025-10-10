-- Temporarily disable triggers
ALTER TABLE public.tasks DISABLE TRIGGER log_task_changes_trigger;
ALTER TABLE public.budget_items DISABLE TRIGGER log_budget_item_changes_trigger;

-- Delete workflows
DELETE FROM public.workflows
WHERE user_id IN (
  '69bdbb88-35a8-4fb3-928e-87d68e52cd8a',
  '96d713dc-3e95-44e4-9618-4314b44b37cf',
  'b0d281ca-c8c8-4d6a-89fc-c9cf3afadaf2',
  '67c55c8b-6e42-4601-b183-79a37dfc9a7e',
  '499fd9fc-7a08-4e08-9594-1ff30c9641c2'
);

-- Delete team assignments
DELETE FROM public.team_assignments
WHERE user_id IN (
  '69bdbb88-35a8-4fb3-928e-87d68e52cd8a',
  '96d713dc-3e95-44e4-9618-4314b44b37cf',
  'b0d281ca-c8c8-4d6a-89fc-c9cf3afadaf2',
  '67c55c8b-6e42-4601-b183-79a37dfc9a7e',
  '499fd9fc-7a08-4e08-9594-1ff30c9641c2'
);

-- Delete tasks
DELETE FROM public.tasks
WHERE assigned_to IN (
  '69bdbb88-35a8-4fb3-928e-87d68e52cd8a',
  '96d713dc-3e95-44e4-9618-4314b44b37cf',
  'b0d281ca-c8c8-4d6a-89fc-c9cf3afadaf2',
  '67c55c8b-6e42-4601-b183-79a37dfc9a7e',
  '499fd9fc-7a08-4e08-9594-1ff30c9641c2'
);

-- Delete budget items
DELETE FROM public.budget_items
WHERE created_by IN (
  '69bdbb88-35a8-4fb3-928e-87d68e52cd8a',
  '96d713dc-3e95-44e4-9618-4314b44b37cf',
  'b0d281ca-c8c8-4d6a-89fc-c9cf3afadaf2',
  '67c55c8b-6e42-4601-b183-79a37dfc9a7e',
  '499fd9fc-7a08-4e08-9594-1ff30c9641c2'
);

-- Re-enable triggers
ALTER TABLE public.tasks ENABLE TRIGGER log_task_changes_trigger;
ALTER TABLE public.budget_items ENABLE TRIGGER log_budget_item_changes_trigger;

-- Delete profiles
DELETE FROM public.profiles
WHERE user_id IN (
  '69bdbb88-35a8-4fb3-928e-87d68e52cd8a',
  '96d713dc-3e95-44e4-9618-4314b44b37cf',
  'b0d281ca-c8c8-4d6a-89fc-c9cf3afadaf2',
  '67c55c8b-6e42-4601-b183-79a37dfc9a7e',
  '499fd9fc-7a08-4e08-9594-1ff30c9641c2'
);

-- Delete user_roles
DELETE FROM public.user_roles
WHERE user_id IN (
  '69bdbb88-35a8-4fb3-928e-87d68e52cd8a',
  '96d713dc-3e95-44e4-9618-4314b44b37cf',
  'b0d281ca-c8c8-4d6a-89fc-c9cf3afadaf2',
  '67c55c8b-6e42-4601-b183-79a37dfc9a7e',
  '499fd9fc-7a08-4e08-9594-1ff30c9641c2'
);

-- Delete from auth.users (this will cascade to any remaining related records)
DELETE FROM auth.users
WHERE id IN (
  '69bdbb88-35a8-4fb3-928e-87d68e52cd8a',
  '96d713dc-3e95-44e4-9618-4314b44b37cf',
  'b0d281ca-c8c8-4d6a-89fc-c9cf3afadaf2',
  '67c55c8b-6e42-4601-b183-79a37dfc9a7e',
  '499fd9fc-7a08-4e08-9594-1ff30c9641c2'
);
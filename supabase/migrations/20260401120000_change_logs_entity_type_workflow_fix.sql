-- Ensure workflow (and related types) are allowed for change_logs.entity_type.
-- Remote DBs may still have an older CHECK named change_logs_entity_type_check1
-- that omits 'workflow', which breaks rpc log_change from the app.
ALTER TABLE public.change_logs DROP CONSTRAINT IF EXISTS change_logs_entity_type_check;
ALTER TABLE public.change_logs DROP CONSTRAINT IF EXISTS change_logs_entity_type_check1;

ALTER TABLE public.change_logs
ADD CONSTRAINT change_logs_entity_type_check
CHECK (
  entity_type IN (
    'task',
    'event',
    'team',
    'role',
    'notification',
    'workflow',
    'budget_item'
  )
);

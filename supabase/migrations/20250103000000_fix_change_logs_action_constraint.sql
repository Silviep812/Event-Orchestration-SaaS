-- Fix change_logs action constraint to include all change request actions
-- Drop existing constraint if it exists
ALTER TABLE public.change_logs 
  DROP CONSTRAINT IF EXISTS change_logs_action_check;

-- Add constraint with all change request actions included
ALTER TABLE public.change_logs 
  ADD CONSTRAINT change_logs_action_check 
  CHECK (action IN ('created', 'updated', 'deleted', 'approved', 'rejected', 'applied', 'cancelled'));

-- Also ensure entity_type includes 'change_request'
ALTER TABLE public.change_logs 
  DROP CONSTRAINT IF EXISTS change_logs_entity_type_check;

ALTER TABLE public.change_logs 
  ADD CONSTRAINT change_logs_entity_type_check 
  CHECK (entity_type IN ('task', 'event', 'budget_item', 'change_request', 'team', 'role', 'notification', 'workflow'));


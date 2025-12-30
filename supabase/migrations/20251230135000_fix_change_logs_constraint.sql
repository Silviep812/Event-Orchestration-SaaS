-- Ensure change_logs constraint includes 'change_request'
-- Drop existing constraint if it exists
ALTER TABLE public.change_logs 
  DROP CONSTRAINT IF EXISTS change_logs_entity_type_check;

-- Add constraint with 'change_request' included
ALTER TABLE public.change_logs 
  ADD CONSTRAINT change_logs_entity_type_check 
  CHECK (entity_type IN ('task', 'event', 'budget_item', 'change_request', 'team', 'role', 'notification', 'workflow'));

-- Update action constraint to include change request actions
ALTER TABLE public.change_logs 
  DROP CONSTRAINT IF EXISTS change_logs_action_check;

ALTER TABLE public.change_logs 
  ADD CONSTRAINT change_logs_action_check 
  CHECK (action IN ('created', 'updated', 'deleted', 'approved', 'rejected', 'applied', 'cancelled'));


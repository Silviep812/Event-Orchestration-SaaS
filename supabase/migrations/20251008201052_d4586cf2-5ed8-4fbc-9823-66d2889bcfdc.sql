-- Allow logging workflow changes by extending the entity_type check constraint
ALTER TABLE public.change_logs DROP CONSTRAINT IF EXISTS change_logs_entity_type_check;

ALTER TABLE public.change_logs
  ADD CONSTRAINT change_logs_entity_type_check
  CHECK (entity_type = ANY (ARRAY['task'::text, 'event'::text, 'budget_item'::text, 'workflow'::text]));
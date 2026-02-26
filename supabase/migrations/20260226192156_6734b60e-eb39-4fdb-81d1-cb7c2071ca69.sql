
ALTER TABLE public.cm_change_logs DROP CONSTRAINT change_logs_action_check;

ALTER TABLE public.cm_change_logs ADD CONSTRAINT change_logs_action_check 
CHECK (action = ANY (ARRAY[
  'created'::text, 'updated'::text, 'deleted'::text, 
  'approved'::text, 'rejected'::text, 'applied'::text, 'cancelled'::text,
  'budget_updated'::text, 'timeline_resync'::text, 'estimate_updated'::text, 'timeline_adjusted'::text
]));

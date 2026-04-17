-- IEP Change Management Rollout: explicit rollout timing (Urgent / Optional / Deferred)
-- alongside existing task-style priority_tag used for coordinator task ordering.

ALTER TABLE public.cm_change_requests
  ADD COLUMN IF NOT EXISTS rollout_timing text NOT NULL DEFAULT 'optional';

ALTER TABLE public.cm_change_requests
  DROP CONSTRAINT IF EXISTS cm_change_requests_rollout_timing_check;

ALTER TABLE public.cm_change_requests
  ADD CONSTRAINT cm_change_requests_rollout_timing_check
  CHECK (rollout_timing = ANY (ARRAY['urgent'::text, 'optional'::text, 'deferred'::text]));

COMMENT ON COLUMN public.cm_change_requests.rollout_timing IS
  'IEP rollout class: urgent (needs fast coordinator action), optional (normal queue), deferred (schedule later).';

UPDATE public.cm_change_requests
SET rollout_timing = 'optional'
WHERE rollout_timing IS NULL;

NOTIFY pgrst, 'reload schema';

-- Lovable / advisor: PERMISSIVE UPDATE policies OR together — a permissive cr_update_own with
-- WITH CHECK (true) lets requesters pass any NEW row. We keep one strict cr_update_own (see below)
-- and block requesters from mutating approval / resolution fields in a BEFORE UPDATE trigger.

ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

-- Do not stack two requester UPDATE policies (PERMISSIVE OR weakens checks)
DROP POLICY IF EXISTS change_requests_update_by_requester ON public.change_requests;

-- Ensure one policy named cr_update_own with explicit WITH CHECK (not true)
DROP POLICY IF EXISTS cr_update_own ON public.change_requests;

CREATE POLICY cr_update_own ON public.change_requests
  FOR UPDATE TO authenticated
  USING (requested_by::text = auth.uid()::text)
  WITH CHECK (requested_by::text = auth.uid()::text);

-- Optional columns (hosted / Lovable); safe if already present
ALTER TABLE public.change_requests
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users (id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS applied_by uuid REFERENCES auth.users (id),
  ADD COLUMN IF NOT EXISTS applied_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

CREATE OR REPLACE FUNCTION public.trg_block_requester_approval_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  -- Only when the row editor is the original requester (invoker = requester)
  IF NEW.requested_by IS NOT NULL AND NEW.requested_by::text = auth.uid()::text THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Requesters cannot change the status of their own change requests.';
    END IF;
    IF NEW.approved_by IS DISTINCT FROM OLD.approved_by THEN
      RAISE EXCEPTION 'Requesters cannot set approved_by on their own change requests.';
    END IF;
    IF NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
      RAISE EXCEPTION 'Requesters cannot set approved_at on their own change requests.';
    END IF;
    IF NEW.applied_by IS DISTINCT FROM OLD.applied_by THEN
      RAISE EXCEPTION 'Requesters cannot set applied_by on their own change requests.';
    END IF;
    IF NEW.applied_at IS DISTINCT FROM OLD.applied_at THEN
      RAISE EXCEPTION 'Requesters cannot set applied_at on their own change requests.';
    END IF;
    IF NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
      RAISE EXCEPTION 'Requesters cannot set rejection_reason on their own change requests.';
    END IF;
    IF NEW.resolved_by IS DISTINCT FROM OLD.resolved_by THEN
      RAISE EXCEPTION 'Requesters cannot set resolved_by on their own change requests.';
    END IF;
    IF NEW.resolved_at IS DISTINCT FROM OLD.resolved_at THEN
      RAISE EXCEPTION 'Requesters cannot set resolved_at on their own change requests.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_block_requester_approval ON public.change_requests;

CREATE TRIGGER trg_block_requester_approval
  BEFORE UPDATE ON public.change_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_block_requester_approval_fields();

NOTIFY pgrst, 'reload schema';

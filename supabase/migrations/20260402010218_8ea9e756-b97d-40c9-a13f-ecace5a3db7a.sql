-- Prevent requesters from self-approving by modifying approval fields
-- This trigger blocks the requester from changing status, approved_by, applied_by, etc.

CREATE OR REPLACE FUNCTION public.trg_block_requester_approval_fields()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  -- Only apply when the updater IS the original requester
  IF NEW.requested_by = auth.uid() THEN
    -- Block changes to approval/status fields
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Requesters cannot change the status of their own change requests. Use the appropriate RPC function.';
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
  END IF;
  RETURN NEW;
END;
$function$;

-- Attach the trigger BEFORE UPDATE
DROP TRIGGER IF EXISTS trg_block_requester_approval ON change_requests;
CREATE TRIGGER trg_block_requester_approval
  BEFORE UPDATE ON change_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_block_requester_approval_fields();
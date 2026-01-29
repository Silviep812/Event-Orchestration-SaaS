-- Verify and re-deploy the trigger to ensure it's properly attached
-- Drop and recreate trigger to ensure clean state
DROP TRIGGER IF EXISTS change_request_to_task_trigger ON public.change_requests;

CREATE TRIGGER change_request_to_task_trigger
  AFTER INSERT OR UPDATE ON public.change_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.create_approval_task_on_change_request();

-- Verify the trigger is enabled
ALTER TABLE public.change_requests ENABLE TRIGGER change_request_to_task_trigger;
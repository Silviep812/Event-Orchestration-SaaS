-- Drop old RPC functions if they exist
DROP FUNCTION IF EXISTS approve_change_request_wr(UUID);
DROP FUNCTION IF EXISTS apply_change_request_wr(UUID);
DROP FUNCTION IF EXISTS cancel_change_request_wr(UUID);

-- Function to get coordinator emails for an event
-- Returns all coordinators (admins, event managers, task coordinators)
-- The p_event_id parameter is kept for future filtering if needed
CREATE OR REPLACE FUNCTION get_coordinator_emails(p_event_id TEXT DEFAULT NULL)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_emails TEXT[];
BEGIN
  -- Get all users with admin or coordinator permission levels
  SELECT ARRAY_AGG(DISTINCT u.email)
  INTO v_emails
  FROM auth.users u
  WHERE (has_permission_level(u.id, 'admin'::permission_level)
     OR has_permission_level(u.id, 'coordinator'::permission_level))
    AND u.email IS NOT NULL;
  
  RETURN COALESCE(v_emails, ARRAY[]::TEXT[]);
END;
$$;

-- Function to send email notification via edge function
CREATE OR REPLACE FUNCTION notify_change_request_email(
  p_change_request_id UUID,
  p_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_emails TEXT[];
  v_supabase_url TEXT;
  v_service_key TEXT;
BEGIN
  -- Get change request details
  SELECT * INTO v_request
  FROM change_requests
  WHERE id = p_change_request_id;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Change request not found: %', p_change_request_id;
    RETURN;
  END IF;
  
  -- Get coordinator emails
  v_emails := get_coordinator_emails(v_request.event_id);
  
  IF array_length(v_emails, 1) = 0 THEN
    RAISE NOTICE 'No coordinator emails found for change request %', p_change_request_id;
    RETURN;
  END IF;
  
  -- Get Supabase URL and service key
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  IF v_supabase_url IS NULL THEN
    v_supabase_url := 'https://' || current_setting('app.settings.project_ref', true) || '.supabase.co';
  END IF;
  
  v_service_key := current_setting('app.settings.service_role_key', true);
  
  -- Call edge function via HTTP (requires pg_net or http extension)
  -- If extension not available, this will be handled by application layer
  BEGIN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/send-change-request-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(v_service_key, '')
      ),
      body := jsonb_build_object(
        'change_request_id', p_change_request_id,
        'status', p_status,
        'event_id', v_request.event_id,
        'task_id', v_request.task_id,
        'title', v_request.title,
        'description', v_request.description,
        'priority_tag', v_request.priority::TEXT,
        'requested_by', v_request.requested_by,
        'coordinatorEmails', v_emails
      )
    );
    
    RAISE NOTICE 'Email notification sent for change request %', p_change_request_id;
  EXCEPTION
    WHEN OTHERS THEN
      -- If http/net extension is not available, log warning
      RAISE WARNING 'Failed to send email notification for change request %: %', p_change_request_id, SQLERRM;
      -- Application layer should handle email sending as fallback
  END;
END;
$$;

-- Function to approve a change request
CREATE OR REPLACE FUNCTION approve_change_request(
  p_change_request_id UUID,
  p_approved_by UUID DEFAULT auth.uid()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_result JSON;
BEGIN
  -- Get change request
  SELECT * INTO v_request
  FROM change_requests
  WHERE id = p_change_request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Change request not found: %', p_change_request_id;
  END IF;
  
  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Change request must be pending to approve. Current status: %', v_request.status;
  END IF;
  
  -- Check permissions
  IF NOT (has_permission_level(auth.uid(), 'admin'::permission_level) OR 
          has_permission_level(auth.uid(), 'coordinator'::permission_level)) THEN
    RAISE EXCEPTION 'Insufficient permissions to approve change requests';
  END IF;
  
  -- Update status
  UPDATE change_requests
  SET 
    status = 'approved',
    approved_by = p_approved_by,
    approved_at = now(),
    updated_at = now()
  WHERE id = p_change_request_id;
  
  -- Send email notification
  PERFORM notify_change_request_email(p_change_request_id, 'approved');
  
  -- Return result
  SELECT json_build_object(
    'success', true,
    'change_request_id', p_change_request_id,
    'status', 'approved'
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Function to reject a change request
CREATE OR REPLACE FUNCTION reject_change_request(
  p_change_request_id UUID,
  p_rejection_reason TEXT,
  p_rejected_by UUID DEFAULT auth.uid()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_result JSON;
BEGIN
  SELECT * INTO v_request
  FROM change_requests
  WHERE id = p_change_request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Change request not found: %', p_change_request_id;
  END IF;
  
  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Change request must be pending to reject. Current status: %', v_request.status;
  END IF;
  
  IF NOT (has_permission_level(auth.uid(), 'admin'::permission_level) OR 
          has_permission_level(auth.uid(), 'coordinator'::permission_level)) THEN
    RAISE EXCEPTION 'Insufficient permissions to reject change requests';
  END IF;
  
  UPDATE change_requests
  SET 
    status = 'rejected',
    approved_by = p_rejected_by,
    approved_at = now(),
    rejection_reason = p_rejection_reason,
    updated_at = now()
  WHERE id = p_change_request_id;
  
  PERFORM notify_change_request_email(p_change_request_id, 'rejected');
  
  SELECT json_build_object(
    'success', true,
    'change_request_id', p_change_request_id,
    'status', 'rejected'
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Function to apply a change request
CREATE OR REPLACE FUNCTION apply_change_request(
  p_change_request_id UUID,
  p_applied_by UUID DEFAULT auth.uid()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_result JSON;
BEGIN
  SELECT * INTO v_request
  FROM change_requests
  WHERE id = p_change_request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Change request not found: %', p_change_request_id;
  END IF;
  
  IF v_request.status != 'approved' THEN
    RAISE EXCEPTION 'Change request must be approved to apply. Current status: %', v_request.status;
  END IF;
  
  IF NOT (has_permission_level(auth.uid(), 'admin'::permission_level) OR 
          has_permission_level(auth.uid(), 'coordinator'::permission_level)) THEN
    RAISE EXCEPTION 'Insufficient permissions to apply change requests';
  END IF;
  
  -- Apply the change based on change_type
  -- For now, we'll just update the status
  -- You can extend this to actually apply changes to events/tasks
  
  UPDATE change_requests
  SET 
    status = 'applied',
    applied_by = p_applied_by,
    applied_at = now(),
    updated_at = now()
  WHERE id = p_change_request_id;
  
  PERFORM notify_change_request_email(p_change_request_id, 'applied');
  
  SELECT json_build_object(
    'success', true,
    'change_request_id', p_change_request_id,
    'status', 'applied'
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Function to cancel a change request
CREATE OR REPLACE FUNCTION cancel_change_request(
  p_change_request_id UUID,
  p_cancelled_by UUID DEFAULT auth.uid()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_result JSON;
BEGIN
  SELECT * INTO v_request
  FROM change_requests
  WHERE id = p_change_request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Change request not found: %', p_change_request_id;
  END IF;
  
  IF v_request.status IN ('applied', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot cancel change request with status: %', v_request.status;
  END IF;
  
  -- Only requester or admin can cancel
  IF v_request.requested_by != p_cancelled_by AND 
     NOT has_permission_level(p_cancelled_by, 'admin'::permission_level) THEN
    RAISE EXCEPTION 'Only the requester or admin can cancel this change request';
  END IF;
  
  UPDATE change_requests
  SET 
    status = 'cancelled',
    updated_at = now()
  WHERE id = p_change_request_id;
  
  PERFORM notify_change_request_email(p_change_request_id, 'cancelled');
  
  SELECT json_build_object(
    'success', true,
    'change_request_id', p_change_request_id,
    'status', 'cancelled'
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_coordinator_emails(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION notify_change_request_email(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_change_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_change_request(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_change_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_change_request(UUID, UUID) TO authenticated;


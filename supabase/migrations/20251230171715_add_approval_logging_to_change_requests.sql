-- Update approve_change_request to log approval actions
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
  v_approver_name TEXT;
  v_field_key TEXT;
  v_field_value JSONB;
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
  
  -- Get approver name
  SELECT display_name INTO v_approver_name
  FROM profiles
  WHERE user_id = p_approved_by;
  
  v_approver_name := COALESCE(v_approver_name, 'Unknown User');
  
  -- Update status
  UPDATE change_requests
  SET 
    status = 'approved',
    approved_by = p_approved_by,
    approved_at = now(),
    updated_at = now()
  WHERE id = p_change_request_id;
  
  -- Log approval for each field change
  IF v_request.field_changes IS NOT NULL AND v_request.event_id IS NOT NULL THEN
    FOR v_field_key, v_field_value IN SELECT * FROM jsonb_each(v_request.field_changes)
    LOOP
      PERFORM log_change(
        'event',
        v_request.event_id::UUID,
        'approved',
        v_field_key,
        v_field_value->>'oldValue',
        v_field_value->>'newValue',
        'Change request approved by ' || v_approver_name || ': ' || v_field_key || ' change approved (pending apply)'
      );
    END LOOP;
  END IF;
  
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

-- Update cancel_change_request to log cancellation actions
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
  v_canceller_name TEXT;
  v_field_key TEXT;
  v_field_value JSONB;
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
  
  -- Get canceller name
  SELECT display_name INTO v_canceller_name
  FROM profiles
  WHERE user_id = p_cancelled_by;
  
  v_canceller_name := COALESCE(v_canceller_name, 'Unknown User');
  
  UPDATE change_requests
  SET 
    status = 'cancelled',
    updated_at = now()
  WHERE id = p_change_request_id;
  
  -- Log cancellation for each field change
  IF v_request.field_changes IS NOT NULL AND v_request.event_id IS NOT NULL THEN
    FOR v_field_key, v_field_value IN SELECT * FROM jsonb_each(v_request.field_changes)
    LOOP
      PERFORM log_change(
        'event',
        v_request.event_id::UUID,
        'cancelled',
        v_field_key,
        v_field_value->>'oldValue',
        v_field_value->>'newValue',
        'Change request cancelled by ' || v_canceller_name || ': ' || v_field_key || ' change request was cancelled'
      );
    END LOOP;
  END IF;
  
  PERFORM notify_change_request_email(p_change_request_id, 'cancelled');
  
  SELECT json_build_object(
    'success', true,
    'change_request_id', p_change_request_id,
    'status', 'cancelled'
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Update reject_change_request to log rejection actions
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
  v_rejector_name TEXT;
  v_field_key TEXT;
  v_field_value JSONB;
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
  
  -- Get rejector name
  SELECT display_name INTO v_rejector_name
  FROM profiles
  WHERE user_id = p_rejected_by;
  
  v_rejector_name := COALESCE(v_rejector_name, 'Unknown User');
  
  UPDATE change_requests
  SET 
    status = 'rejected',
    approved_by = p_rejected_by,
    approved_at = now(),
    rejection_reason = p_rejection_reason,
    updated_at = now()
  WHERE id = p_change_request_id;
  
  -- Log rejection for each field change
  IF v_request.field_changes IS NOT NULL AND v_request.event_id IS NOT NULL THEN
    FOR v_field_key, v_field_value IN SELECT * FROM jsonb_each(v_request.field_changes)
    LOOP
      PERFORM log_change(
        'event',
        v_request.event_id::UUID,
        'rejected',
        v_field_key,
        v_field_value->>'oldValue',
        v_field_value->>'newValue',
        'Change request rejected by ' || v_rejector_name || ': ' || p_rejection_reason
      );
    END LOOP;
  END IF;
  
  PERFORM notify_change_request_email(p_change_request_id, 'rejected');
  
  SELECT json_build_object(
    'success', true,
    'change_request_id', p_change_request_id,
    'status', 'rejected'
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Update cancel_change_request to log cancellation actions
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
  v_canceller_name TEXT;
  v_field_key TEXT;
  v_field_value JSONB;
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
  
  -- Get canceller name
  SELECT display_name INTO v_canceller_name
  FROM profiles
  WHERE user_id = p_cancelled_by;
  
  v_canceller_name := COALESCE(v_canceller_name, 'Unknown User');
  
  UPDATE change_requests
  SET 
    status = 'cancelled',
    updated_at = now()
  WHERE id = p_change_request_id;
  
  -- Log cancellation for each field change
  IF v_request.field_changes IS NOT NULL AND v_request.event_id IS NOT NULL THEN
    FOR v_field_key, v_field_value IN SELECT * FROM jsonb_each(v_request.field_changes)
    LOOP
      PERFORM log_change(
        'event',
        v_request.event_id::UUID,
        'cancelled',
        v_field_key,
        v_field_value->>'oldValue',
        v_field_value->>'newValue',
        'Change request cancelled by ' || v_canceller_name || ': ' || v_field_key || ' change request was cancelled'
      );
    END LOOP;
  END IF;
  
  PERFORM notify_change_request_email(p_change_request_id, 'cancelled');
  
  SELECT json_build_object(
    'success', true,
    'change_request_id', p_change_request_id,
    'status', 'cancelled'
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Update apply_change_request to log application actions (if not already done)
-- This should already be in the migration that adds field_changes, but let's ensure it logs properly
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
  v_field_changes JSONB;
  v_field_key TEXT;
  v_field_value JSONB;
  v_update_data JSONB := '{}'::JSONB;
  v_applier_name TEXT;
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
  
  -- Get applier name
  SELECT display_name INTO v_applier_name
  FROM profiles
  WHERE user_id = p_applied_by;
  
  v_applier_name := COALESCE(v_applier_name, 'Unknown User');
  
  -- Get field changes from JSONB column
  v_field_changes := v_request.field_changes;
  
  -- If field_changes exists and event_id is set, apply changes to the event
  IF v_field_changes IS NOT NULL AND v_request.event_id IS NOT NULL THEN
    -- Build update data from field_changes
    FOR v_field_key, v_field_value IN SELECT * FROM jsonb_each(v_field_changes)
    LOOP
      -- Extract newValue from the field change object
      v_update_data := v_update_data || jsonb_build_object(
        v_field_key, 
        v_field_value->>'newValue'
      );
    END LOOP;
    
    -- Convert JSONB values to appropriate types and update the event
    IF v_request.event_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      UPDATE events
      SET 
        title = CASE WHEN v_update_data ? 'title' THEN (v_update_data->>'title')::TEXT ELSE title END,
        description = CASE WHEN v_update_data ? 'description' THEN (v_update_data->>'description')::TEXT ELSE description END,
        start_date = CASE WHEN v_update_data ? 'start_date' AND (v_update_data->>'start_date') != 'null' AND (v_update_data->>'start_date') != '' THEN (v_update_data->>'start_date')::DATE ELSE start_date END,
        end_date = CASE WHEN v_update_data ? 'end_date' AND (v_update_data->>'end_date') != 'null' AND (v_update_data->>'end_date') != '' THEN (v_update_data->>'end_date')::DATE ELSE end_date END,
        start_time = CASE WHEN v_update_data ? 'start_time' AND (v_update_data->>'start_time') != 'null' AND (v_update_data->>'start_time') != '' THEN (v_update_data->>'start_time')::TIME ELSE start_time END,
        end_time = CASE WHEN v_update_data ? 'end_time' AND (v_update_data->>'end_time') != 'null' AND (v_update_data->>'end_time') != '' THEN (v_update_data->>'end_time')::TIME ELSE end_time END,
        location = CASE WHEN v_update_data ? 'location' THEN (v_update_data->>'location')::TEXT ELSE location END,
        venue = CASE WHEN v_update_data ? 'venue' THEN (v_update_data->>'venue')::TEXT ELSE venue END,
        theme_id = CASE WHEN v_update_data ? 'theme_id' AND (v_update_data->>'theme_id') != 'null' AND (v_update_data->>'theme_id') != '' THEN (v_update_data->>'theme_id')::INTEGER ELSE theme_id END,
        type_id = CASE WHEN v_update_data ? 'type_id' AND (v_update_data->>'type_id') != 'null' AND (v_update_data->>'type_id') != '' THEN (v_update_data->>'type_id')::INTEGER ELSE type_id END,
        status = CASE WHEN v_update_data ? 'status' AND (v_update_data->>'status') != 'null' AND (v_update_data->>'status') != '' THEN (v_update_data->>'status')::event_status_enum ELSE status END,
        budget = CASE WHEN v_update_data ? 'budget' AND (v_update_data->>'budget') != 'null' AND (v_update_data->>'budget') != '' THEN (v_update_data->>'budget')::NUMERIC ELSE budget END,
        updated_at = now()
      WHERE id = v_request.event_id::UUID;
      
      -- Log each field change with applier name
      FOR v_field_key, v_field_value IN SELECT * FROM jsonb_each(v_field_changes)
      LOOP
        PERFORM log_change(
          'event',
          v_request.event_id::UUID,
          'applied',
          v_field_key,
          v_field_value->>'oldValue',
          v_field_value->>'newValue',
          'Applied by ' || v_applier_name || ': ' || v_field_key || ' changed from "' || COALESCE(v_field_value->>'oldValue', 'empty') || '" to "' || COALESCE(v_field_value->>'newValue', 'empty') || '"'
        );
      END LOOP;
    END IF;
  END IF;
  
  -- Update change request status
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
    'status', 'applied',
    'fields_applied', jsonb_object_keys(COALESCE(v_field_changes, '{}'::JSONB))
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Update cancel_change_request to log cancellation actions
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
  v_canceller_name TEXT;
  v_field_key TEXT;
  v_field_value JSONB;
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
  
  -- Get canceller name
  SELECT display_name INTO v_canceller_name
  FROM profiles
  WHERE user_id = p_cancelled_by;
  
  v_canceller_name := COALESCE(v_canceller_name, 'Unknown User');
  
  UPDATE change_requests
  SET 
    status = 'cancelled',
    updated_at = now()
  WHERE id = p_change_request_id;
  
  -- Log cancellation for each field change
  IF v_request.field_changes IS NOT NULL AND v_request.event_id IS NOT NULL THEN
    FOR v_field_key, v_field_value IN SELECT * FROM jsonb_each(v_request.field_changes)
    LOOP
      PERFORM log_change(
        'event',
        v_request.event_id::UUID,
        'cancelled',
        v_field_key,
        v_field_value->>'oldValue',
        v_field_value->>'newValue',
        'Change request cancelled by ' || v_canceller_name || ': ' || v_field_key || ' change request was cancelled'
      );
    END LOOP;
  END IF;
  
  PERFORM notify_change_request_email(p_change_request_id, 'cancelled');
  
  SELECT json_build_object(
    'success', true,
    'change_request_id', p_change_request_id,
    'status', 'cancelled'
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;


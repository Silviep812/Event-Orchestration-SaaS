-- Create all change request RPC functions
-- This ensures all functions exist even if migrations weren't run in order

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
      -- Log to change_logs table
      INSERT INTO change_logs (
        entity_type,
        entity_id,
        action,
        field_name,
        old_value,
        new_value,
        change_description,
        changed_by
      )
      VALUES (
        'change_request',
        p_change_request_id,
        'approved',
        v_field_key,
        v_field_value->>'oldValue',
        v_field_value->>'newValue',
        'Change request approved by ' || v_approver_name || ': ' || v_field_key || ' change approved (pending apply)',
        p_approved_by
      );
    END LOOP;
  END IF;
  
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
  v_rejector_name TEXT;
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
  
  -- Log rejection
  INSERT INTO change_logs (
    entity_type,
    entity_id,
    action,
    change_description,
    changed_by
  )
  VALUES (
    'change_request',
    p_change_request_id,
    'rejected',
    'Change request rejected by ' || v_rejector_name || ': ' || p_rejection_reason,
    p_rejected_by
  );
  
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
    -- Check if event_id is UUID (events table) or TEXT (Create Event table)
    IF v_request.event_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      -- UUID format - update events table
      FOR v_field_key, v_field_value IN SELECT * FROM jsonb_each(v_field_changes)
      LOOP
        -- Build update query dynamically
        IF v_field_key = 'title' THEN
          UPDATE events SET title = (v_field_value->>'newValue')::TEXT, updated_at = now() WHERE id = v_request.event_id::UUID;
        ELSIF v_field_key = 'description' THEN
          UPDATE events SET description = (v_field_value->>'newValue')::TEXT, updated_at = now() WHERE id = v_request.event_id::UUID;
        ELSIF v_field_key = 'start_date' AND v_field_value->>'newValue' IS NOT NULL AND v_field_value->>'newValue' != 'null' AND v_field_value->>'newValue' != '' THEN
          UPDATE events SET start_date = (v_field_value->>'newValue')::DATE, updated_at = now() WHERE id = v_request.event_id::UUID;
        ELSIF v_field_key = 'end_date' AND v_field_value->>'newValue' IS NOT NULL AND v_field_value->>'newValue' != 'null' AND v_field_value->>'newValue' != '' THEN
          UPDATE events SET end_date = (v_field_value->>'newValue')::DATE, updated_at = now() WHERE id = v_request.event_id::UUID;
        ELSIF v_field_key = 'start_time' AND v_field_value->>'newValue' IS NOT NULL AND v_field_value->>'newValue' != 'null' AND v_field_value->>'newValue' != '' THEN
          UPDATE events SET start_time = (v_field_value->>'newValue')::TIME, updated_at = now() WHERE id = v_request.event_id::UUID;
        ELSIF v_field_key = 'end_time' AND v_field_value->>'newValue' IS NOT NULL AND v_field_value->>'newValue' != 'null' AND v_field_value->>'newValue' != '' THEN
          UPDATE events SET end_time = (v_field_value->>'newValue')::TIME, updated_at = now() WHERE id = v_request.event_id::UUID;
        ELSIF v_field_key = 'location' THEN
          UPDATE events SET location = (v_field_value->>'newValue')::TEXT, updated_at = now() WHERE id = v_request.event_id::UUID;
        ELSIF v_field_key = 'venue' THEN
          UPDATE events SET venue = (v_field_value->>'newValue')::TEXT, updated_at = now() WHERE id = v_request.event_id::UUID;
        ELSIF v_field_key = 'theme_id' AND v_field_value->>'newValue' IS NOT NULL AND v_field_value->>'newValue' != 'null' AND v_field_value->>'newValue' != '' THEN
          UPDATE events SET theme_id = (v_field_value->>'newValue')::INTEGER, updated_at = now() WHERE id = v_request.event_id::UUID;
        ELSIF v_field_key = 'type_id' AND v_field_value->>'newValue' IS NOT NULL AND v_field_value->>'newValue' != 'null' AND v_field_value->>'newValue' != '' THEN
          UPDATE events SET type_id = (v_field_value->>'newValue')::INTEGER, updated_at = now() WHERE id = v_request.event_id::UUID;
        ELSIF v_field_key = 'status' AND v_field_value->>'newValue' IS NOT NULL AND v_field_value->>'newValue' != 'null' AND v_field_value->>'newValue' != '' THEN
          UPDATE events SET status = (v_field_value->>'newValue')::event_status_enum, updated_at = now() WHERE id = v_request.event_id::UUID;
        ELSIF v_field_key = 'budget' AND v_field_value->>'newValue' IS NOT NULL AND v_field_value->>'newValue' != 'null' AND v_field_value->>'newValue' != '' THEN
          UPDATE events SET budget = (v_field_value->>'newValue')::NUMERIC, updated_at = now() WHERE id = v_request.event_id::UUID;
        END IF;
        
        -- Log each field change
        INSERT INTO change_logs (
          entity_type,
          entity_id,
          action,
          field_name,
          old_value,
          new_value,
          change_description,
          changed_by
        )
        VALUES (
          'event',
          v_request.event_id::UUID,
          'applied',
          v_field_key,
          v_field_value->>'oldValue',
          v_field_value->>'newValue',
          'Applied by ' || v_applier_name || ': ' || v_field_key || ' changed from "' || COALESCE(v_field_value->>'oldValue', 'empty') || '" to "' || COALESCE(v_field_value->>'newValue', 'empty') || '"',
          p_applied_by
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
  
  -- Log change request application
  INSERT INTO change_logs (
    entity_type,
    entity_id,
    action,
    change_description,
    changed_by
  )
  VALUES (
    'change_request',
    p_change_request_id,
    'applied',
    'Change request applied by ' || v_applier_name,
    p_applied_by
  );
  
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
  v_canceller_name TEXT;
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
  
  -- Log cancellation
  INSERT INTO change_logs (
    entity_type,
    entity_id,
    action,
    change_description,
    changed_by
  )
  VALUES (
    'change_request',
    p_change_request_id,
    'cancelled',
    'Change request cancelled by ' || v_canceller_name,
    p_cancelled_by
  );
  
  SELECT json_build_object(
    'success', true,
    'change_request_id', p_change_request_id,
    'status', 'cancelled'
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION approve_change_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_change_request(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_change_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_change_request(UUID, UUID) TO authenticated;


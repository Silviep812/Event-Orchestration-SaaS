-- Add field_changes JSONB column to store structured field changes
ALTER TABLE public.change_requests 
ADD COLUMN IF NOT EXISTS field_changes JSONB;

-- Add comment explaining the structure
COMMENT ON COLUMN public.change_requests.field_changes IS 
'Stores field changes as JSONB: {"field_name": {"oldValue": "...", "newValue": "..."}, ...}';

-- Create index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_change_requests_field_changes ON public.change_requests USING GIN (field_changes);

-- Update apply_change_request function to automatically apply field changes
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
    -- event_id is TEXT and should be a UUID matching events.id
    -- Check if event_id is a valid UUID format
    IF v_request.event_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      -- It's a UUID, update events table
      -- Use CASE to only update fields that exist in field_changes
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
      
      -- Log each field change
      FOR v_field_key, v_field_value IN SELECT * FROM jsonb_each(v_field_changes)
      LOOP
        PERFORM log_change(
          'event',
          v_request.event_id::UUID,
          'updated',
          v_field_key,
          v_field_value->>'oldValue',
          v_field_value->>'newValue',
          'Applied via change request: ' || v_request.title
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


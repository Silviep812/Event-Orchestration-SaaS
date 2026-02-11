
-- 1. apply_change_request: 2 occurrences of "INSERT INTO change_logs" → "INSERT INTO public.cm_change_logs"
CREATE OR REPLACE FUNCTION public.apply_change_request(p_change_request_id uuid, p_applied_by uuid DEFAULT auth.uid())
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_request RECORD;
  v_result JSON;
  v_field_changes JSONB;
  v_field_key TEXT;
  v_field_value JSONB;
  v_update_data JSONB := '{}'::JSONB;
  v_applier_name TEXT;
  v_new_location TEXT;
  v_new_venue TEXT;
  v_new_start_date DATE;
  v_new_end_date DATE;
  v_new_start_time TIME;
  v_new_end_time TIME;
  v_new_budget NUMERIC;
  v_new_status event_status_enum;
  v_event_id UUID;
  v_event_userid TEXT;
  v_venue_category_id INTEGER;
  v_available_status_id INTEGER;
  v_existing_venue_resource_id UUID;
  v_current_budget_total NUMERIC;
  v_budget_ratio NUMERIC;
  v_task_status task_status;
  v_new_theme_id INTEGER;
  v_venue_id UUID;
  v_new_location_array TEXT[];
  v_new_theme_array TEXT[];
  v_theme_name TEXT;
  v_log_field_name TEXT;
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
    
    -- Extract specific field values for related table updates
    IF v_update_data ? 'location' AND (v_update_data->>'location') != 'null' AND (v_update_data->>'location') != '' THEN
      v_new_location := (v_update_data->>'location')::TEXT;
    END IF;
    
    IF v_update_data ? 'venue' AND (v_update_data->>'venue') != 'null' AND (v_update_data->>'venue') != '' THEN
      v_new_venue := (v_update_data->>'venue')::TEXT;
    END IF;
    
    -- Check if trying to change dates when venue booking is completed
    IF (v_update_data ? 'start_date' AND (v_update_data->>'start_date') != 'null' AND (v_update_data->>'start_date') != '') OR
       (v_update_data ? 'end_date' AND (v_update_data->>'end_date') != 'null' AND (v_update_data->>'end_date') != '') THEN
      
      -- Check if venue booking is completed
      IF is_venue_booking_completed(v_request.event_id) THEN
        RAISE EXCEPTION 'Cannot change event dates because venue booking is completed. Delete and recreate the event to change dates.';
      END IF;
      
      -- Extract date values only if venue booking check passes
      IF v_update_data ? 'start_date' AND (v_update_data->>'start_date') != 'null' AND (v_update_data->>'start_date') != '' THEN
        v_new_start_date := (v_update_data->>'start_date')::DATE;
      END IF;
      
      IF v_update_data ? 'end_date' AND (v_update_data->>'end_date') != 'null' AND (v_update_data->>'end_date') != '' THEN
        v_new_end_date := (v_update_data->>'end_date')::DATE;
      END IF;
    END IF;
    
    -- Check if trying to change times when venue booking is completed (NEW - Time Locking)
    IF (v_update_data ? 'start_time' AND (v_update_data->>'start_time') != 'null' AND (v_update_data->>'start_time') != '') OR
       (v_update_data ? 'end_time' AND (v_update_data->>'end_time') != 'null' AND (v_update_data->>'end_time') != '') THEN
      
      -- Check if venue booking is completed
      IF is_venue_booking_completed(v_request.event_id) THEN
        RAISE EXCEPTION 'Cannot change event times because venue booking is completed. Delete and recreate the event to change times.';
      END IF;
      
      -- Extract time values only if venue booking check passes
      IF v_update_data ? 'start_time' AND (v_update_data->>'start_time') != 'null' AND (v_update_data->>'start_time') != '' THEN
        v_new_start_time := (v_update_data->>'start_time')::TIME;
      END IF;
      
      IF v_update_data ? 'end_time' AND (v_update_data->>'end_time') != 'null' AND (v_update_data->>'end_time') != '' THEN
        v_new_end_time := (v_update_data->>'end_time')::TIME;
      END IF;
    END IF;
    
    IF v_update_data ? 'budget' AND (v_update_data->>'budget') != 'null' AND (v_update_data->>'budget') != '' THEN
      v_new_budget := (v_update_data->>'budget')::NUMERIC;
    END IF;
    
    IF v_update_data ? 'status' AND (v_update_data->>'status') != 'null' AND (v_update_data->>'status') != '' THEN
      v_new_status := (v_update_data->>'status')::event_status_enum;
    END IF;
    
    -- Check if event_id is UUID (events table) or TEXT (Create Event table)
    IF v_request.event_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      -- UUID format - update events table
      v_event_id := v_request.event_id::UUID;
      
      -- Update the event
      UPDATE events
      SET 
        title = CASE WHEN v_update_data ? 'title' THEN (v_update_data->>'title')::TEXT ELSE title END,
        description = CASE WHEN v_update_data ? 'description' THEN (v_update_data->>'description')::TEXT ELSE description END,
        start_date = CASE WHEN v_new_start_date IS NOT NULL THEN v_new_start_date ELSE start_date END,
        end_date = CASE WHEN v_new_end_date IS NOT NULL THEN v_new_end_date ELSE end_date END,
        start_time = CASE WHEN v_new_start_time IS NOT NULL THEN v_new_start_time ELSE (CASE WHEN v_update_data ? 'start_time' AND (v_update_data->>'start_time') != 'null' AND (v_update_data->>'start_time') != '' THEN (v_update_data->>'start_time')::TIME ELSE start_time END) END,
        end_time = CASE WHEN v_new_end_time IS NOT NULL THEN v_new_end_time ELSE (CASE WHEN v_update_data ? 'end_time' AND (v_update_data->>'end_time') != 'null' AND (v_update_data->>'end_time') != '' THEN (v_update_data->>'end_time')::TIME ELSE end_time END) END,
        location = CASE WHEN v_new_location IS NOT NULL THEN v_new_location ELSE location END,
        venue = CASE WHEN v_new_venue IS NOT NULL THEN v_new_venue ELSE venue END,
        theme_id = CASE WHEN v_update_data ? 'theme_id' AND (v_update_data->>'theme_id') != 'null' AND (v_update_data->>'theme_id') != '' THEN (v_update_data->>'theme_id')::INTEGER ELSE theme_id END,
        type_id = CASE WHEN v_update_data ? 'type_id' AND (v_update_data->>'type_id') != 'null' AND (v_update_data->>'type_id') != '' THEN (v_update_data->>'type_id')::INTEGER ELSE type_id END,
        status = CASE WHEN v_new_status IS NOT NULL THEN v_new_status ELSE status END,
        budget = CASE WHEN v_new_budget IS NOT NULL THEN v_new_budget ELSE budget END,
        updated_at = now()
      WHERE id = v_event_id;
      
      -- AUTOFILL RELATED FIELDS for UUID-based events
      
      -- 1. Update resources.location when event.location changes
      IF v_new_location IS NOT NULL THEN
        UPDATE resources
        SET 
          location = v_new_location,
          updated_at = now()
        WHERE event_id = v_event_id;
      END IF;
      
      -- 2. Update venue resource when event.venue changes
      IF v_new_venue IS NOT NULL THEN
        -- Try to find venue category
        SELECT id INTO v_venue_category_id
        FROM resource_categories
        WHERE LOWER(name) LIKE '%venue%'
        LIMIT 1;
        
        -- Get available status
        SELECT id INTO v_available_status_id
        FROM resource_status
        WHERE LOWER(name) LIKE '%available%' OR LOWER(name) LIKE '%active%'
        LIMIT 1;
        
        -- Update or create venue resource
        IF v_venue_category_id IS NOT NULL THEN
          -- Check if venue resource exists
          SELECT id INTO v_existing_venue_resource_id
          FROM resources
          WHERE event_id = v_event_id
          AND category_id = v_venue_category_id
          LIMIT 1;
          
          IF v_existing_venue_resource_id IS NOT NULL THEN
            -- Update existing venue resource
            UPDATE resources
            SET 
              name = v_new_venue,
              location = COALESCE(v_new_location, location),
              updated_at = now()
            WHERE id = v_existing_venue_resource_id;
          ELSE
            -- Create new venue resource if it doesn't exist
            INSERT INTO resources (
              name,
              category_id,
              status_id,
              location,
              allocated,
              total,
              event_id
            )
            VALUES (
              v_new_venue,
              v_venue_category_id,
              COALESCE(v_available_status_id, 1),
              COALESCE(v_new_location, ''),
              1,
              1,
              v_event_id
            );
          END IF;
        END IF;
      END IF;
      
      -- 3. Update tasks.due_date when event dates change
      IF v_new_start_date IS NOT NULL OR v_new_end_date IS NOT NULL THEN
        -- Update tasks that don't have explicit due_date or are close to event dates
        UPDATE tasks
        SET 
          due_date = CASE 
            WHEN v_new_end_date IS NOT NULL AND due_date IS NULL THEN 
              (v_new_end_date::TIMESTAMP WITH TIME ZONE)
            WHEN v_new_end_date IS NOT NULL AND due_date > (v_new_end_date::TIMESTAMP WITH TIME ZONE) THEN
              (v_new_end_date::TIMESTAMP WITH TIME ZONE)
            ELSE due_date
          END,
          start_date = CASE 
            WHEN v_new_start_date IS NOT NULL AND start_date IS NULL THEN 
              v_new_start_date
            WHEN v_new_start_date IS NOT NULL AND start_date < v_new_start_date THEN
              v_new_start_date
            ELSE start_date
          END,
          end_date = CASE 
            WHEN v_new_end_date IS NOT NULL AND end_date IS NULL THEN 
              v_new_end_date
            WHEN v_new_end_date IS NOT NULL AND end_date > v_new_end_date THEN
              v_new_end_date
            ELSE end_date
          END,
          updated_at = now()
        WHERE event_id = v_event_id
        AND (due_date IS NULL OR due_date > (COALESCE(v_new_end_date, end_date)::TIMESTAMP WITH TIME ZONE));
      END IF;
      
      -- 4. Update budget_items when event.budget changes
      IF v_new_budget IS NOT NULL THEN
        -- Calculate current total of estimated costs
        SELECT COALESCE(SUM(estimated_cost), 0) INTO v_current_budget_total
        FROM budget_items
        WHERE event_id = v_event_id
        AND archived = false;
        
        -- If there are budget items, scale them proportionally
        IF v_current_budget_total > 0 THEN
          v_budget_ratio := v_new_budget / v_current_budget_total;
          
          -- Update estimated costs proportionally (only for items without actual_cost)
          UPDATE budget_items
          SET 
            estimated_cost = estimated_cost * v_budget_ratio,
            updated_at = now()
          WHERE event_id = v_event_id
          AND archived = false
          AND (actual_cost IS NULL OR actual_cost = 0);
        END IF;
      END IF;
      
      -- 5. Update task statuses when event.status changes
      IF v_new_status IS NOT NULL THEN
        -- Map event status to task status
        CASE v_new_status
          WHEN 'completed'::event_status_enum THEN
            v_task_status := 'completed'::task_status;
          WHEN 'cancelled'::event_status_enum THEN
            v_task_status := 'cancelled'::task_status;
          WHEN 'in_progress'::event_status_enum THEN
            v_task_status := 'in_progress'::task_status;
          ELSE
            v_task_status := NULL; -- Don't change task status for 'pending'
        END CASE;
        
        -- Update task statuses if mapping exists
        IF v_task_status IS NOT NULL THEN
          UPDATE tasks
          SET 
            status = v_task_status,
            updated_at = now()
          WHERE event_id = v_event_id
          AND status NOT IN ('completed', 'cancelled'); -- Don't override completed/cancelled tasks
        END IF;
      END IF;
      
      -- 6. Update workflows when event.venue or theme_id changes
      IF v_new_venue IS NOT NULL OR (v_update_data ? 'theme_id' AND (v_update_data->>'theme_id') != 'null' AND (v_update_data->>'theme_id') != '') THEN
        -- Get new theme_id if changed
        IF v_update_data ? 'theme_id' AND (v_update_data->>'theme_id') != 'null' AND (v_update_data->>'theme_id') != '' THEN
          v_new_theme_id := (v_update_data->>'theme_id')::INTEGER;
        END IF;
        
        -- Try to find venue_id from venues table if venue name changed
        IF v_new_venue IS NOT NULL THEN
          SELECT id INTO v_venue_id
          FROM venues
          WHERE business_name = v_new_venue
          LIMIT 1;
        END IF;
        
        -- Update workflow if it exists
        UPDATE workflows
        SET 
          theme_id = CASE WHEN v_new_theme_id IS NOT NULL THEN v_new_theme_id ELSE theme_id END,
          venue_id = CASE WHEN v_venue_id IS NOT NULL THEN v_venue_id ELSE venue_id END,
          updated_at = now()
        WHERE event_id = v_event_id;
      END IF;
      
      -- Log each field change with applier name for UUID-based events
      FOR v_field_key, v_field_value IN SELECT * FROM jsonb_each(v_field_changes)
      LOOP
        INSERT INTO public.cm_change_logs (
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
          v_event_id,
          'applied',
          v_field_key,
          v_field_value->>'oldValue',
          v_field_value->>'newValue',
          'Applied by ' || v_applier_name || ': ' || v_field_key || ' changed from "' || COALESCE(v_field_value->>'oldValue', 'empty') || '" to "' || COALESCE(v_field_value->>'newValue', 'empty') || '"',
          p_applied_by
        );
      END LOOP;
    ELSE
      -- TEXT format - update "Create Event" table
      v_event_userid := v_request.event_id;
      
      -- Convert location to array format if needed (Create Event uses text[])
      IF v_new_location IS NOT NULL THEN
        v_new_location_array := ARRAY[v_new_location];
      END IF;
      
      -- Convert theme_id to array format if needed (Create Event uses text[])
      IF v_update_data ? 'theme_id' AND (v_update_data->>'theme_id') != 'null' AND (v_update_data->>'theme_id') != '' THEN
        -- Get theme name from theme_id
        SELECT name INTO v_theme_name
        FROM event_themes
        WHERE id = (v_update_data->>'theme_id')::INTEGER
        LIMIT 1;
        
        IF v_theme_name IS NOT NULL THEN
          v_new_theme_array := ARRAY[v_theme_name];
        END IF;
      END IF;
      
      -- Update "Create Event" table
      UPDATE "Create Event"
      SET 
        event_description = CASE WHEN v_update_data ? 'description' AND (v_update_data->>'description') != 'null' AND (v_update_data->>'description') != '' THEN (v_update_data->>'description')::TEXT ELSE event_description END,
        event_start_date = CASE WHEN v_new_start_date IS NOT NULL THEN v_new_start_date ELSE event_start_date END,
        event_end_date = CASE WHEN v_new_end_date IS NOT NULL THEN v_new_end_date ELSE event_end_date END,
        event_start_time = CASE WHEN v_new_start_time IS NOT NULL THEN (v_new_start_time::TEXT)::TIMESTAMP WITH TIME ZONE ELSE (CASE WHEN v_update_data ? 'start_time' AND (v_update_data->>'start_time') != 'null' AND (v_update_data->>'start_time') != '' THEN (v_update_data->>'start_time')::TIMESTAMP WITH TIME ZONE ELSE event_start_time END) END,
        event_end_time = CASE WHEN v_new_end_time IS NOT NULL THEN (v_new_end_time::TEXT)::TIMESTAMP WITH TIME ZONE ELSE (CASE WHEN v_update_data ? 'end_time' AND (v_update_data->>'end_time') != 'null' AND (v_update_data->>'end_time') != '' THEN (v_update_data->>'end_time')::TIMESTAMP WITH TIME ZONE ELSE event_end_time END) END,
        event_location = CASE WHEN v_new_location_array IS NOT NULL THEN v_new_location_array ELSE event_location END,
        event_budget = CASE WHEN v_new_budget IS NOT NULL THEN v_new_budget ELSE event_budget END,
        event_theme = CASE WHEN v_new_theme_array IS NOT NULL THEN v_new_theme_array ELSE event_theme END
      WHERE userid = v_event_userid;
      
      -- Log each field change with applier name for TEXT-based events
      FOR v_field_key, v_field_value IN SELECT * FROM jsonb_each(v_field_changes)
      LOOP
        -- Map field names from events table to Create Event table for logging
        CASE v_field_key
          WHEN 'description' THEN v_log_field_name := 'event_description';
          WHEN 'start_date' THEN v_log_field_name := 'event_start_date';
          WHEN 'end_date' THEN v_log_field_name := 'event_end_date';
          WHEN 'start_time' THEN v_log_field_name := 'event_start_time';
          WHEN 'end_time' THEN v_log_field_name := 'event_end_time';
          WHEN 'location' THEN v_log_field_name := 'event_location';
          WHEN 'budget' THEN v_log_field_name := 'event_budget';
          WHEN 'theme_id' THEN v_log_field_name := 'event_theme';
          ELSE v_log_field_name := v_field_key;
        END CASE;
        
        INSERT INTO public.cm_change_logs (
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
          'create_event',
          v_event_userid,
          'applied',
          v_log_field_name,
          v_field_value->>'oldValue',
          v_field_value->>'newValue',
          'Applied by ' || v_applier_name || ': ' || v_log_field_name || ' changed from "' || COALESCE(v_field_value->>'oldValue', 'empty') || '" to "' || COALESCE(v_field_value->>'newValue', 'empty') || '"',
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
  
  -- Send email notification (if function exists) - wrapped in exception handling
  BEGIN
    PERFORM notify_change_request_email(p_change_request_id, 'applied');
  EXCEPTION
    WHEN undefined_function THEN
      -- Function doesn't exist, skip email notification
      RAISE NOTICE 'Email notification function not available, skipping notification';
    WHEN OTHERS THEN
      -- Other errors, log but don't fail
      RAISE WARNING 'Failed to send email notification: %', SQLERRM;
  END;
  
  SELECT json_build_object(
    'success', true,
    'change_request_id', p_change_request_id,
    'status', 'applied',
    'fields_applied', jsonb_object_keys(COALESCE(v_field_changes, '{}'::JSONB))
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$;

-- 2. approve_change_request: 1 occurrence "INSERT INTO change_logs" → "INSERT INTO public.cm_change_logs"
CREATE OR REPLACE FUNCTION public.approve_change_request(p_change_request_id uuid, p_approved_by uuid DEFAULT auth.uid())
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_request RECORD;
  v_result JSON;
  v_approver_name TEXT;
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
  
  -- Log approval
  INSERT INTO public.cm_change_logs (
    entity_type,
    entity_id,
    action,
    change_description,
    changed_by
  )
  VALUES (
    'change_request',
    p_change_request_id,
    'approved',
    'Change request approved by ' || v_approver_name,
    p_approved_by
  );
  
  -- Return result
  SELECT json_build_object(
    'success', true,
    'change_request_id', p_change_request_id,
    'status', 'approved'
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$;

-- 3. reject_change_request: 1 occurrence "INSERT INTO change_logs" → "INSERT INTO public.cm_change_logs"
CREATE OR REPLACE FUNCTION public.reject_change_request(p_change_request_id uuid, p_rejection_reason text, p_rejected_by uuid DEFAULT auth.uid())
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  INSERT INTO public.cm_change_logs (
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
$function$;

-- 4. cancel_change_request: 1 occurrence "INSERT INTO change_logs" → "INSERT INTO public.cm_change_logs"
CREATE OR REPLACE FUNCTION public.cancel_change_request(p_change_request_id uuid, p_cancelled_by uuid DEFAULT auth.uid())
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  INSERT INTO public.cm_change_logs (
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
$function$;

-- 5. sync_downstream_on_change_applied: 2 occurrences "INSERT INTO change_logs" → "INSERT INTO public.cm_change_logs"
CREATE OR REPLACE FUNCTION public.sync_downstream_on_change_applied()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_event_id UUID;
  v_field_changes JSONB;
  v_date_changed BOOLEAN := false;
  v_budget_changed BOOLEAN := false;
BEGIN
  -- Only trigger when status changes to 'applied'
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status 
     AND NEW.status = 'applied' THEN
    
    v_field_changes := NEW.field_changes;
    
    -- Only process if event_id is a valid UUID
    IF NEW.event_id IS NOT NULL AND NEW.event_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      v_event_id := NEW.event_id::UUID;
      
      -- Check if date fields changed
      IF v_field_changes IS NOT NULL AND (v_field_changes ? 'start_date' OR v_field_changes ? 'end_date') THEN
        v_date_changed := true;
        
        -- Trigger timeline resync for all tasks in the event
        PERFORM recalculate_project_timeline(v_event_id);
        
        -- Log the resync
        INSERT INTO public.cm_change_logs (entity_type, entity_id, action, change_description, changed_by)
        VALUES ('event', v_event_id, 'timeline_resync', 
                'Timeline recalculated due to applied change request', 
                NEW.applied_by);
      END IF;
      
      -- Check if budget changed
      IF v_field_changes IS NOT NULL AND v_field_changes ? 'budget' THEN
        v_budget_changed := true;
        
        -- Log the budget update
        INSERT INTO public.cm_change_logs (entity_type, entity_id, action, change_description, changed_by)
        VALUES ('event', v_event_id, 'budget_updated', 
                'Budget items recalculated due to applied change request', 
                NEW.applied_by);
      END IF;
    END IF;
    
    -- Update the approval task status to 'completed'
    UPDATE tasks
    SET status = 'completed', updated_at = now()
    WHERE change_request_id = NEW.id
      AND category = 'Approval'
      AND status != 'completed';
  END IF;
  
  RETURN NEW;
END;
$function$;

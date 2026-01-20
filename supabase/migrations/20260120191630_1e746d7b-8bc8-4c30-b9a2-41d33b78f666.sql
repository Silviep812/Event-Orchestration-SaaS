-- Create function to update resource utilization
CREATE OR REPLACE FUNCTION public.update_resource_utilization(
  p_resource_id UUID,
  p_allocated INTEGER,
  p_total INTEGER
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_utilization_percent NUMERIC;
  v_result JSON;
BEGIN
  -- Calculate utilization percentage
  IF p_total > 0 THEN
    v_utilization_percent := ROUND((p_allocated::NUMERIC / p_total::NUMERIC) * 100, 2);
  ELSE
    v_utilization_percent := 0;
  END IF;
  
  -- Update the resource
  UPDATE resources
  SET 
    allocated = p_allocated,
    total = p_total,
    updated_at = now()
  WHERE id = p_resource_id;
  
  -- Return result
  SELECT json_build_object(
    'success', true,
    'resource_id', p_resource_id,
    'allocated', p_allocated,
    'total', p_total,
    'utilization_percent', v_utilization_percent
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Create function to recalculate downstream tasks
CREATE OR REPLACE FUNCTION public.recalculate_downstream_tasks(
  p_task_id UUID,
  p_new_due_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE(
  task_id UUID,
  old_due_date TIMESTAMP WITH TIME ZONE,
  new_due_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_event_id UUID;
  v_original_due_date TIMESTAMP WITH TIME ZONE;
  v_time_shift INTERVAL;
  v_task_record RECORD;
BEGIN
  -- Get the event_id and original due date of the changed task
  SELECT t.event_id, t.due_date INTO v_event_id, v_original_due_date
  FROM tasks t
  WHERE t.id = p_task_id;
  
  IF v_event_id IS NULL THEN
    RETURN; -- No event associated, nothing to recalculate
  END IF;
  
  -- Calculate time shift
  IF p_new_due_date IS NOT NULL AND v_original_due_date IS NOT NULL THEN
    v_time_shift := p_new_due_date - v_original_due_date;
  ELSE
    v_time_shift := INTERVAL '0';
  END IF;
  
  -- Find and update downstream tasks (tasks with later due dates in same event)
  FOR v_task_record IN 
    SELECT t.id, t.due_date
    FROM tasks t
    WHERE t.event_id = v_event_id
      AND t.id != p_task_id
      AND t.due_date > v_original_due_date
      AND t.status NOT IN ('completed', 'cancelled')
    ORDER BY t.due_date ASC
  LOOP
    -- Update the task due date
    UPDATE tasks
    SET 
      due_date = v_task_record.due_date + v_time_shift,
      updated_at = now()
    WHERE id = v_task_record.id;
    
    -- Return the changes
    task_id := v_task_record.id;
    old_due_date := v_task_record.due_date;
    new_due_date := v_task_record.due_date + v_time_shift;
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;
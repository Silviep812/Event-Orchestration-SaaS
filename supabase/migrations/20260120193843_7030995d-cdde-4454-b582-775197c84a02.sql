-- Fix recalculate_downstream_tasks to accept original due date as parameter
-- This fixes the bug where the function was reading the already-updated due_date

CREATE OR REPLACE FUNCTION public.recalculate_downstream_tasks(
  p_task_id UUID,
  p_original_due_date TIMESTAMP WITH TIME ZONE,
  p_new_due_date TIMESTAMP WITH TIME ZONE
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
  v_time_shift INTERVAL;
  v_task_record RECORD;
BEGIN
  -- Get the event_id from the task
  SELECT t.event_id INTO v_event_id
  FROM tasks t WHERE t.id = p_task_id;
  
  IF v_event_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate time shift using passed parameters (not from DB)
  IF p_new_due_date IS NOT NULL AND p_original_due_date IS NOT NULL THEN
    v_time_shift := p_new_due_date - p_original_due_date;
  ELSE
    v_time_shift := INTERVAL '0';
  END IF;
  
  -- If no shift, nothing to do
  IF v_time_shift = INTERVAL '0' THEN
    RETURN;
  END IF;
  
  -- Find and update all downstream tasks in the same event
  FOR v_task_record IN 
    SELECT t.id, t.due_date
    FROM tasks t
    WHERE t.event_id = v_event_id
      AND t.id != p_task_id
      AND t.due_date > p_original_due_date
      AND t.status NOT IN ('completed', 'cancelled')
    ORDER BY t.due_date ASC
  LOOP
    -- Update the downstream task's due date
    UPDATE tasks
    SET due_date = v_task_record.due_date + v_time_shift,
        updated_at = now()
    WHERE id = v_task_record.id;
    
    -- Return the updated task info
    task_id := v_task_record.id;
    old_due_date := v_task_record.due_date;
    new_due_date := v_task_record.due_date + v_time_shift;
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.recalculate_downstream_tasks(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
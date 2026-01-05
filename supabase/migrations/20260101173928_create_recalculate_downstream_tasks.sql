-- Create function to recalculate downstream tasks
-- This function adjusts downstream tasks when a task's estimate changes
-- It can be called with either a task_id (to recalculate from that task) or event_id (to recalculate all tasks)
CREATE OR REPLACE FUNCTION recalculate_downstream_tasks(
  p_task_id UUID DEFAULT NULL,
  p_event_id UUID DEFAULT NULL
)
RETURNS TABLE (
  task_id UUID,
  new_due_date TIMESTAMP WITH TIME ZONE,
  estimated_completion TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_base_task_due_date TIMESTAMP WITH TIME ZONE;
  v_task_record RECORD;
  v_dependent_task RECORD;
  v_calc_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Determine event_id from task_id if provided
  IF p_task_id IS NOT NULL THEN
    SELECT event_id, due_date INTO v_event_id, v_base_task_due_date
    FROM tasks
    WHERE id = p_task_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Task not found: %', p_task_id;
    END IF;
    
    -- If event_id was also provided, use it; otherwise use the one from task
    IF p_event_id IS NOT NULL AND p_event_id != v_event_id THEN
      RAISE EXCEPTION 'Task event_id (%) does not match provided event_id (%)', v_event_id, p_event_id;
    END IF;
    
    p_event_id := v_event_id;
  END IF;
  
  IF p_event_id IS NULL THEN
    RAISE EXCEPTION 'Either p_task_id or p_event_id must be provided';
  END IF;
  
  -- If task_id was provided, recalculate only downstream tasks (tasks with due_date > base task's due_date)
  IF p_task_id IS NOT NULL AND v_base_task_due_date IS NOT NULL THEN
    -- Recalculate downstream tasks
    FOR v_dependent_task IN 
      SELECT t.id, t.title, t.estimated_hours, t.due_date, t.priority
      FROM tasks t
      WHERE t.event_id = p_event_id
        AND t.id != p_task_id
        AND t.due_date > v_base_task_due_date
        AND t.status NOT IN ('completed', 'cancelled')
      ORDER BY t.due_date ASC
    LOOP
      -- Calculate new due date based on base task's completion + buffer
      v_calc_date := v_base_task_due_date + 
        (COALESCE((SELECT estimated_hours FROM tasks WHERE id = p_task_id), 0) || ' hours')::interval +
        interval '30 minutes'; -- Buffer between tasks
      
      -- Add this task's estimated hours
      v_calc_date := v_calc_date + (COALESCE(v_dependent_task.estimated_hours, 1) || ' hours')::interval;
      
      -- Update the task
      UPDATE tasks
      SET due_date = v_calc_date,
          updated_at = now()
      WHERE id = v_dependent_task.id;
      
      -- Return the update
      RETURN QUERY SELECT 
        v_dependent_task.id,
        v_calc_date,
        v_calc_date;
      
      -- Update base date for next iteration
      v_base_task_due_date := v_calc_date;
    END LOOP;
  ELSE
    -- If only event_id provided, use the existing recalculate_project_timeline logic
    -- This is essentially an alias/wrapper for recalculate_project_timeline
    RETURN QUERY SELECT * FROM recalculate_project_timeline(p_event_id);
  END IF;
  
  RETURN;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION recalculate_downstream_tasks(UUID, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION recalculate_downstream_tasks(UUID, UUID) IS 'Recalculates downstream tasks when a task estimate changes. Can be called with task_id (recalculates from that task) or event_id (recalculates all tasks for the event).';


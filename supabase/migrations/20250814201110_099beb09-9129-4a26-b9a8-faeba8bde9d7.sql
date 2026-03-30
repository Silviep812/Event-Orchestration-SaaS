-- Create function to handle task estimate changes and cascade updates
CREATE OR REPLACE FUNCTION public.handle_task_estimate_change()
RETURNS TRIGGER AS $$
DECLARE
  task_record RECORD;
  dependent_task RECORD;
  total_time_change NUMERIC := 0;
BEGIN
  -- Calculate the time difference
  IF TG_OP = 'UPDATE' AND OLD.estimated_hours IS DISTINCT FROM NEW.estimated_hours THEN
    total_time_change := COALESCE(NEW.estimated_hours, 0) - COALESCE(OLD.estimated_hours, 0);
    
    -- Log the change
    PERFORM public.log_change(
      'task'::text,
      NEW.id,
      'estimate_updated'::text,
      'estimated_hours'::text,
      OLD.estimated_hours::text,
      NEW.estimated_hours::text,
      format('Task estimate changed from %s to %s hours (difference: %s)', 
             COALESCE(OLD.estimated_hours::text, 'null'), 
             COALESCE(NEW.estimated_hours::text, 'null'),
             total_time_change)
    );
    
    -- Update dependent tasks (tasks with later due dates in the same event)
    FOR dependent_task IN 
      SELECT id, title, due_date, estimated_hours
      FROM public.tasks 
      WHERE event_id = NEW.event_id 
        AND id != NEW.id 
        AND due_date > NEW.due_date
      ORDER BY due_date ASC
    LOOP
      -- Shift dependent task due dates if the estimate increased significantly (>2 hours)
      IF total_time_change > 2 THEN
        UPDATE public.tasks 
        SET due_date = due_date + (total_time_change || ' hours')::interval,
            updated_at = now()
        WHERE id = dependent_task.id;
        
        -- Log the dependent task update
        PERFORM public.log_change(
          'task'::text,
          dependent_task.id,
          'timeline_adjusted'::text,
          'due_date'::text,
          dependent_task.due_date::text,
          (dependent_task.due_date + (total_time_change || ' hours')::interval)::text,
          format('Due date adjusted by %s hours due to upstream task estimate change', total_time_change)
        );
      END IF;
    END LOOP;
    
    -- Notify coordinators about the change
    PERFORM public.notify_coordinators(
      format('Task Estimate Changed: %s', NEW.title),
      format('Task "%s" estimate changed from %s to %s hours. Dependent tasks have been automatically adjusted.',
             NEW.title,
             COALESCE(OLD.estimated_hours::text, 'unset'),
             COALESCE(NEW.estimated_hours::text, 'unset')),
      'task_estimate_change'::text,
      'task'::text,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for task estimate changes
DROP TRIGGER IF EXISTS task_estimate_change_trigger ON public.tasks;
CREATE TRIGGER task_estimate_change_trigger
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_task_estimate_change();

-- Create function to recalculate project timeline
CREATE OR REPLACE FUNCTION public.recalculate_project_timeline(p_event_id UUID)
RETURNS TABLE (
  task_id UUID,
  new_due_date TIMESTAMP WITH TIME ZONE,
  estimated_completion TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  base_date TIMESTAMP WITH TIME ZONE;
  v_running_ts TIMESTAMP WITH TIME ZONE;
  task_record RECORD;
BEGIN
  -- Get the earliest task start date for this event
  SELECT MIN(due_date - (COALESCE(estimated_hours, 0) || ' hours')::interval)
  INTO base_date
  FROM public.tasks
  WHERE event_id = p_event_id;
  
  -- If no base date found, use current time
  IF base_date IS NULL THEN
    base_date := now();
  END IF;
  
  v_running_ts := base_date;
  
  -- Recalculate timeline for all tasks in dependency order
  FOR task_record IN 
    SELECT t.id, t.title, t.estimated_hours, t.priority
    FROM public.tasks t
    WHERE t.event_id = p_event_id
    ORDER BY 
      CASE t.priority 
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END,
      t.created_at
  LOOP
    -- Calculate new due date
    v_running_ts := v_running_ts + (COALESCE(task_record.estimated_hours, 1) || ' hours')::interval;
    
    -- Update the task
    UPDATE public.tasks
    SET due_date = v_running_ts,
        updated_at = now()
    WHERE id = task_record.id;
    
    -- Return the updates
    RETURN QUERY SELECT 
      task_record.id,
      v_running_ts,
      v_running_ts;
    
    -- Add buffer time between tasks (30 minutes)
    v_running_ts := v_running_ts + interval '30 minutes';
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_event_due_date ON public.tasks(event_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_estimate_hours ON public.tasks(estimated_hours) WHERE estimated_hours IS NOT NULL;
-- Create sync_downstream_on_change_applied trigger function
CREATE OR REPLACE FUNCTION sync_downstream_on_change_applied()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
        INSERT INTO change_logs (entity_type, entity_id, action, change_description, changed_by)
        VALUES ('event', v_event_id, 'timeline_resync', 
                'Timeline recalculated due to applied change request', 
                NEW.applied_by);
      END IF;
      
      -- Check if budget changed
      IF v_field_changes IS NOT NULL AND v_field_changes ? 'budget' THEN
        v_budget_changed := true;
        
        -- Log the budget update
        INSERT INTO change_logs (entity_type, entity_id, action, change_description, changed_by)
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
$$;

-- Create the trigger (drop first if exists)
DROP TRIGGER IF EXISTS sync_downstream_after_change_applied ON change_requests;

CREATE TRIGGER sync_downstream_after_change_applied
  AFTER UPDATE ON change_requests
  FOR EACH ROW
  EXECUTE FUNCTION sync_downstream_on_change_applied();

-- Create conflict detection function
CREATE OR REPLACE FUNCTION check_timeline_conflicts(p_event_id UUID)
RETURNS TABLE (
  conflict_type TEXT,
  task_id UUID,
  task_title TEXT,
  conflict_details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check for tasks due after event end date
  RETURN QUERY
  SELECT 
    'TASK_EXCEEDS_EVENT'::TEXT,
    t.id,
    t.title,
    format('Task due date %s exceeds event end date', t.due_date::DATE)
  FROM tasks t
  JOIN events e ON e.id = t.event_id
  WHERE t.event_id = p_event_id
    AND t.due_date::DATE > e.end_date
    AND t.status NOT IN ('completed', 'cancelled');
    
  -- Check for dependency violations (if tasks_dependencies table exists)
  BEGIN
    RETURN QUERY
    SELECT 
      'DEPENDENCY_CONFLICT'::TEXT,
      t.id,
      t.title,
      format('Task depends on "%s" which has later due date', dep.title)
    FROM tasks t
    JOIN tasks_dependencies td ON td.task_id = t.id
    JOIN tasks dep ON dep.id = td.depends_on_task_id
    WHERE t.event_id = p_event_id
      AND t.due_date < dep.due_date
      AND t.status NOT IN ('completed', 'cancelled');
  EXCEPTION
    WHEN undefined_table THEN
      -- tasks_dependencies table doesn't exist, skip this check
      NULL;
  END;
    
  RETURN;
END;
$$;
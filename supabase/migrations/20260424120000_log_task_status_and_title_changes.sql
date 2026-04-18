-- Audit task status and title changes in cm_change_logs (via log_change), alongside existing fields.

CREATE OR REPLACE FUNCTION public.log_task_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.title IS DISTINCT FROM NEW.title THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'title', OLD.title, NEW.title);
    END IF;

    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM public.log_change(
        'task',
        NEW.id,
        'updated',
        'status',
        COALESCE(OLD.status::text, ''),
        COALESCE(NEW.status::text, '')
      );
    END IF;

    IF OLD.start_date IS DISTINCT FROM NEW.start_date THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'start_date', OLD.start_date::text, NEW.start_date::text);
    END IF;

    IF OLD.end_date IS DISTINCT FROM NEW.end_date THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'end_date', OLD.end_date::text, NEW.end_date::text);
    END IF;

    IF OLD.start_time IS DISTINCT FROM NEW.start_time THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'start_time', OLD.start_time::text, NEW.start_time::text);
    END IF;

    IF OLD.end_time IS DISTINCT FROM NEW.end_time THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'end_time', OLD.end_time::text, NEW.end_time::text);
    END IF;

    IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'due_date', OLD.due_date::text, NEW.due_date::text);
    END IF;

    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'assigned_to', OLD.assigned_to::text, NEW.assigned_to::text);
    END IF;

    IF OLD.description IS DISTINCT FROM NEW.description THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'description', OLD.description, NEW.description);
    END IF;

    IF OLD.category IS DISTINCT FROM NEW.category THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'category', OLD.category, NEW.category);
    END IF;

    IF OLD.estimated_hours IS DISTINCT FROM NEW.estimated_hours THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'estimated_hours', OLD.estimated_hours::text, NEW.estimated_hours::text);
    END IF;

    IF OLD.actual_hours IS DISTINCT FROM NEW.actual_hours THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'actual_hours', OLD.actual_hours::text, NEW.actual_hours::text);
    END IF;

    IF OLD.event_id IS DISTINCT FROM NEW.event_id THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'event_id', OLD.event_id::text, NEW.event_id::text);
    END IF;

    IF OLD.archived IS DISTINCT FROM NEW.archived THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'archived', OLD.archived::text, NEW.archived::text);
    END IF;

    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      PERFORM public.log_change('task', NEW.id, 'updated', 'priority', OLD.priority::text, NEW.priority::text);
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.log_change(
      'task',
      NEW.id,
      'created',
      NULL,
      NULL,
      NULL,
      format('Task "%s" created with priority %s', NEW.title, NEW.priority)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_change(
      'task',
      OLD.id,
      'deleted',
      NULL,
      NULL,
      NULL,
      format('Task "%s" deleted', OLD.title)
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

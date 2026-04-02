-- Fix search_path on remaining public functions

CREATE OR REPLACE FUNCTION public.handle_task_estimate_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  task_record RECORD;
  dependent_task RECORD;
  total_time_change NUMERIC := 0;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.estimated_hours IS DISTINCT FROM NEW.estimated_hours THEN
    total_time_change := COALESCE(NEW.estimated_hours, 0) - COALESCE(OLD.estimated_hours, 0);
    
    PERFORM public.log_change(
      'task'::text, NEW.id, 'estimate_updated'::text, 'estimated_hours'::text,
      OLD.estimated_hours::text, NEW.estimated_hours::text,
      format('Task estimate changed from %s to %s hours (difference: %s)', 
             COALESCE(OLD.estimated_hours::text, 'null'), 
             COALESCE(NEW.estimated_hours::text, 'null'), total_time_change)
    );
    
    FOR dependent_task IN 
      SELECT id, title, due_date, estimated_hours
      FROM public.tasks WHERE event_id = NEW.event_id AND id != NEW.id AND due_date > NEW.due_date
      ORDER BY due_date ASC
    LOOP
      IF total_time_change > 2 THEN
        UPDATE public.tasks 
        SET due_date = due_date + (total_time_change || ' hours')::interval, updated_at = now()
        WHERE id = dependent_task.id;
        
        PERFORM public.log_change(
          'task'::text, dependent_task.id, 'timeline_adjusted'::text, 'due_date'::text,
          dependent_task.due_date::text,
          (dependent_task.due_date + (total_time_change || ' hours')::interval)::text,
          format('Due date adjusted by %s hours due to upstream task estimate change', total_time_change)
        );
      END IF;
    END LOOP;
    
    PERFORM public.notify_coordinators(
      format('Task Estimate Changed: %s', NEW.title),
      format('Task "%s" estimate changed from %s to %s hours. Dependent tasks have been automatically adjusted.',
             NEW.title, COALESCE(OLD.estimated_hours::text, 'unset'), COALESCE(NEW.estimated_hours::text, 'unset')),
      'task_estimate_change'::text, 'task'::text, NEW.id
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_coordinators(p_title text, p_message text, p_type text, p_entity_type text DEFAULT NULL::text, p_entity_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  coordinator_id UUID;
BEGIN
  FOR coordinator_id IN 
    SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'event_manager', 'task_coordinator')
  LOOP
    INSERT INTO public.notifications (recipient_id, sender_id, title, message, type, entity_type, entity_id)
    VALUES (coordinator_id, auth.uid(), p_title, p_message, p_type, p_entity_type, p_entity_id);
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.recalculate_project_timeline(p_event_id uuid)
RETURNS TABLE(task_id uuid, new_due_date timestamp with time zone, estimated_completion timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  base_date TIMESTAMP WITH TIME ZONE;
  calc_date TIMESTAMP WITH TIME ZONE;
  task_record RECORD;
BEGIN
  SELECT MIN(due_date - (COALESCE(estimated_hours, 0) || ' hours')::interval)
  INTO base_date FROM public.tasks WHERE event_id = p_event_id;
  
  IF base_date IS NULL THEN base_date := now(); END IF;
  calc_date := base_date;
  
  FOR task_record IN 
    SELECT t.id, t.title, t.estimated_hours, t.priority
    FROM public.tasks t WHERE t.event_id = p_event_id AND t.status NOT IN ('completed', 'cancelled')
    ORDER BY t.priority ASC, t.due_date ASC NULLS LAST
  LOOP
    calc_date := calc_date + (COALESCE(task_record.estimated_hours, 1) || ' hours')::interval;
    
    UPDATE public.tasks SET due_date = calc_date, updated_at = now() WHERE id = task_record.id;
    
    task_id := task_record.id;
    new_due_date := calc_date;
    estimated_completion := calc_date;
    RETURN NEXT;
  END LOOP;
  RETURN;
END;
$function$;
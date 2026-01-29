-- Add change_request_id column to tasks table for linking approval tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS change_request_id UUID REFERENCES public.change_requests(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_change_request_id ON public.tasks(change_request_id);

-- Create trigger function to auto-create tasks when change requests are created/updated
CREATE OR REPLACE FUNCTION public.create_approval_task_on_change_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_task_title TEXT;
  v_task_description TEXT;
  v_task_priority task_priority;
  v_event_id UUID;
BEGIN
  -- Only trigger on status changes for UPDATE, or for INSERT with pending status
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Convert event_id to UUID if it's a valid UUID format
    IF NEW.event_id IS NOT NULL AND NEW.event_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      v_event_id := NEW.event_id::UUID;
    ELSE
      v_event_id := NULL;
    END IF;
    
    -- Handle approved status
    IF NEW.status = 'approved' THEN
      v_task_title := 'Apply Approved Changes: ' || NEW.title;
      v_task_description := 'Change request approved. Apply the changes to complete this workflow. Request ID: ' || NEW.id::TEXT;
      v_task_priority := COALESCE(NEW.priority, 'medium'::task_priority);
      
      INSERT INTO public.tasks (
        title, description, status, priority, event_id, 
        created_by, category, due_date, change_request_id
      ) VALUES (
        v_task_title,
        v_task_description,
        'not_started'::task_status,
        v_task_priority,
        v_event_id,
        COALESCE(NEW.approved_by, NEW.requested_by),
        'Approval',
        NOW() + INTERVAL '3 days',
        NEW.id
      );
    
    -- Handle rejected status
    ELSIF NEW.status = 'rejected' THEN
      v_task_title := 'Review Rejected Request: ' || NEW.title;
      v_task_description := 'Change request was rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'No reason provided') || '. Request ID: ' || NEW.id::TEXT;
      
      INSERT INTO public.tasks (
        title, description, status, priority, event_id,
        created_by, category, due_date, change_request_id
      ) VALUES (
        v_task_title,
        v_task_description,
        'not_started'::task_status,
        'medium'::task_priority,
        v_event_id,
        NEW.requested_by,
        'Approval',
        NOW() + INTERVAL '7 days',
        NEW.id
      );
    END IF;
  
  -- Handle new pending change requests
  ELSIF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    IF NEW.event_id IS NOT NULL AND NEW.event_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      v_event_id := NEW.event_id::UUID;
    ELSE
      v_event_id := NULL;
    END IF;
    
    v_task_title := 'Review Change Request: ' || NEW.title;
    v_task_description := 'A new change request requires your review. Accept or Decline. Request ID: ' || NEW.id::TEXT;
    v_task_priority := COALESCE(NEW.priority, 'medium'::task_priority);
    
    INSERT INTO public.tasks (
      title, description, status, priority, event_id,
      created_by, category, due_date, change_request_id
    ) VALUES (
      v_task_title,
      v_task_description,
      'not_started'::task_status,
      v_task_priority,
      v_event_id,
      NEW.requested_by,
      'Approval',
      NOW() + INTERVAL '2 days',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS change_request_to_task_trigger ON public.change_requests;

CREATE TRIGGER change_request_to_task_trigger
  AFTER INSERT OR UPDATE ON public.change_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.create_approval_task_on_change_request();
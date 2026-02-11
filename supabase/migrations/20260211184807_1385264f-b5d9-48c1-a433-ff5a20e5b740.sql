
-- Step 1: Rename table
ALTER TABLE IF EXISTS public.change_logs RENAME TO cm_change_logs;

-- Step 2: Rename primary key index
ALTER INDEX IF EXISTS change_logs_pkey RENAME TO cm_change_logs_pkey;

-- Step 3: Drop all possible prior RLS policy names (idempotent)
DROP POLICY IF EXISTS "Users can view change logs for their data" ON public.cm_change_logs;
DROP POLICY IF EXISTS "Users can view their own change logs" ON public.cm_change_logs;
DROP POLICY IF EXISTS "System can create change logs" ON public.cm_change_logs;

-- Recreate RLS policies
CREATE POLICY "Users can view their own change logs"
ON public.cm_change_logs
FOR SELECT
USING (changed_by = auth.uid());

CREATE POLICY "System can create change logs"
ON public.cm_change_logs
FOR INSERT
WITH CHECK (changed_by = auth.uid());

-- Step 4: Update log_change() to insert into cm_change_logs
CREATE OR REPLACE FUNCTION public.log_change(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_field_name TEXT DEFAULT NULL,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.cm_change_logs (
    entity_type,
    entity_id,
    action,
    field_name,
    old_value,
    new_value,
    changed_by,
    change_description
  )
  VALUES (
    p_entity_type,
    p_entity_id,
    p_action,
    p_field_name,
    p_old_value,
    p_new_value,
    auth.uid(),
    p_description
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

-- Step 5: Update log_change_request_changes() to insert into cm_change_logs
CREATE OR REPLACE FUNCTION public.log_change_request_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.cm_change_logs (entity_type, entity_id, action, changed_by, change_description)
    VALUES ('change_request', NEW.id, 'created', COALESCE(auth.uid(), NEW.requested_by), 'Change request created: ' || NEW.title);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.title IS DISTINCT FROM NEW.title THEN
      INSERT INTO public.cm_change_logs (entity_type, entity_id, action, field_name, old_value, new_value, changed_by, change_description)
      VALUES ('change_request', NEW.id, 'updated', 'title', OLD.title, NEW.title, COALESCE(auth.uid(), NEW.requested_by), 'Title changed');
    END IF;
    IF OLD.description IS DISTINCT FROM NEW.description THEN
      INSERT INTO public.cm_change_logs (entity_type, entity_id, action, field_name, old_value, new_value, changed_by, change_description)
      VALUES ('change_request', NEW.id, 'updated', 'description', OLD.description, NEW.description, COALESCE(auth.uid(), NEW.requested_by), 'Description changed');
    END IF;
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      INSERT INTO public.cm_change_logs (entity_type, entity_id, action, field_name, old_value, new_value, changed_by, change_description)
      VALUES ('change_request', NEW.id, 'updated', 'priority', OLD.priority::text, NEW.priority::text, COALESCE(auth.uid(), NEW.requested_by), 'Priority changed');
    END IF;
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.cm_change_logs (entity_type, entity_id, action, field_name, old_value, new_value, changed_by, change_description)
      VALUES ('change_request', NEW.id, 'updated', 'status', OLD.status::text, NEW.status::text, COALESCE(auth.uid(), NEW.requested_by), 'Status changed to ' || NEW.status::text);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

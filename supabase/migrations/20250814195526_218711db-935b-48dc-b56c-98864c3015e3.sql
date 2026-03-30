-- Create change_logs table for tracking changes to tasks and events
CREATE TABLE IF NOT EXISTS public.change_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'event', 'budget_item')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID NOT NULL,
  change_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.change_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for change_logs
DROP POLICY IF EXISTS "Users can view change logs for their data" ON public.change_logs;
CREATE POLICY "Users can view change logs for their data" 
ON public.change_logs 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'event_manager'::app_role) OR
  changed_by = auth.uid()
);

DROP POLICY IF EXISTS "System can create change logs" ON public.change_logs;
CREATE POLICY "System can create change logs" 
ON public.change_logs 
FOR INSERT 
WITH CHECK (changed_by = auth.uid());

-- Create notifications table for coordinator notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID NOT NULL,
  sender_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_request', 'task_update', 'event_update', 'budget_update')),
  entity_type TEXT CHECK (entity_type IN ('task', 'event', 'budget_item')),
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
CREATE POLICY "Users can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (sender_id = auth.uid() OR sender_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (recipient_id = auth.uid());

-- Create function to log changes
CREATE OR REPLACE FUNCTION log_change(
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
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.change_logs (
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

-- Create function to notify coordinators
CREATE OR REPLACE FUNCTION notify_coordinators(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  coordinator_id UUID;
BEGIN
  -- Get all users with coordinator roles
  FOR coordinator_id IN 
    SELECT user_id 
    FROM public.user_roles 
    WHERE role IN ('admin', 'event_manager', 'task_coordinator')
  LOOP
    INSERT INTO public.notifications (
      recipient_id,
      sender_id,
      title,
      message,
      type,
      entity_type,
      entity_id
    )
    VALUES (
      coordinator_id,
      auth.uid(),
      p_title,
      p_message,
      p_type,
      p_entity_type,
      p_entity_id
    );
  END LOOP;
END;
$$;
-- Drop old change request table and related objects
DROP TRIGGER IF EXISTS change_request_log_trigger ON public.cm_change_requests;
DROP FUNCTION IF EXISTS log_change_request_status();
DROP FUNCTION IF EXISTS notify_change_request_status(UUID, TEXT);
DROP FUNCTION IF EXISTS get_coordinator_emails(UUID);
DROP TABLE IF EXISTS public.cm_change_requests CASCADE;

-- Ensure tasks table has a primary key constraint (required for foreign key)
DO $$
BEGIN
  -- Check if primary key constraint exists, if not add it
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conrelid = 'public.tasks'::regclass 
    AND contype = 'p'
  ) THEN
    ALTER TABLE public.tasks ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Create new change_requests table with proper schema
CREATE TABLE public.change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status change_status NOT NULL DEFAULT 'pending',
  priority task_priority NOT NULL DEFAULT 'medium',
  
  -- Relationships
  -- Note: event_id is TEXT to match "Create Event".userid which is TEXT
  event_id TEXT,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  
  -- Request metadata
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  applied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  applied_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional fields
  rejection_reason TEXT,
  change_type change_type DEFAULT 'event_update',
  
  -- Constraints
  CONSTRAINT valid_status_transition CHECK (
    (status = 'pending' AND approved_by IS NULL AND applied_by IS NULL) OR
    (status = 'approved' AND approved_by IS NOT NULL AND applied_by IS NULL) OR
    (status = 'rejected' AND approved_by IS NOT NULL) OR
    (status = 'applied' AND approved_by IS NOT NULL AND applied_by IS NOT NULL) OR
    (status = 'cancelled')
  )
);

-- Create indexes for performance
CREATE INDEX idx_change_requests_status ON public.change_requests(status);
CREATE INDEX idx_change_requests_event_id ON public.change_requests(event_id);
CREATE INDEX idx_change_requests_task_id ON public.change_requests(task_id);
CREATE INDEX idx_change_requests_requested_by ON public.change_requests(requested_by);
CREATE INDEX idx_change_requests_created_at ON public.change_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view change requests for their events"
ON public.change_requests
FOR SELECT
USING (
  has_permission_level(auth.uid(), 'admin'::permission_level) OR
  has_permission_level(auth.uid(), 'coordinator'::permission_level) OR
  requested_by = auth.uid() OR
  -- Check if user owns the event (event_id matches userid in Create Event)
  EXISTS (
    SELECT 1 FROM public."Create Event" ce
    WHERE ce.userid = change_requests.event_id
    AND ce.userid = auth.uid()::text
  )
);

CREATE POLICY "Users can create change requests"
ON public.change_requests
FOR INSERT
WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Coordinators can update change requests"
ON public.change_requests
FOR UPDATE
USING (
  has_permission_level(auth.uid(), 'admin'::permission_level) OR
  has_permission_level(auth.uid(), 'coordinator'::permission_level) OR
  requested_by = auth.uid()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_change_request_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER change_request_updated_at_trigger
  BEFORE UPDATE ON public.change_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_change_request_updated_at();

-- Create trigger to log changes
CREATE OR REPLACE FUNCTION log_change_request_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.change_logs (
      entity_type,
      entity_id,
      action,
      change_description,
      changed_by
    )
    VALUES (
      'change_request',
      NEW.id,
      'created',
      'Change request created: ' || NEW.title,
      COALESCE(NEW.requested_by, auth.uid())
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.change_logs (
        entity_type,
        entity_id,
        action,
        change_description,
        changed_by
      )
      VALUES (
        'change_request',
        NEW.id,
        NEW.status,
        'Status changed from ' || OLD.status || ' to ' || NEW.status,
        auth.uid()
      );
    END IF;
    
    -- Log other field changes
    IF OLD.title IS DISTINCT FROM NEW.title OR
       OLD.description IS DISTINCT FROM NEW.description OR
       OLD.priority IS DISTINCT FROM NEW.priority THEN
      INSERT INTO public.change_logs (
        entity_type,
        entity_id,
        action,
        field_name,
        old_value,
        new_value,
        change_description,
        changed_by
      )
      VALUES (
        'change_request',
        NEW.id,
        'updated',
        CASE 
          WHEN OLD.title IS DISTINCT FROM NEW.title THEN 'title'
          WHEN OLD.description IS DISTINCT FROM NEW.description THEN 'description'
          WHEN OLD.priority IS DISTINCT FROM NEW.priority THEN 'priority'
        END,
        CASE 
          WHEN OLD.title IS DISTINCT FROM NEW.title THEN OLD.title
          WHEN OLD.description IS DISTINCT FROM NEW.description THEN OLD.description
          WHEN OLD.priority IS DISTINCT FROM NEW.priority THEN OLD.priority::TEXT
        END,
        CASE 
          WHEN OLD.title IS DISTINCT FROM NEW.title THEN NEW.title
          WHEN OLD.description IS DISTINCT FROM NEW.description THEN NEW.description
          WHEN OLD.priority IS DISTINCT FROM NEW.priority THEN NEW.priority::TEXT
        END,
        'Change request updated',
        auth.uid()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER change_request_log_trigger
  AFTER INSERT OR UPDATE ON public.change_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_change_request_changes();

-- Update change_logs to support change_request entity type if not already done
DO $$
BEGIN
  -- Check if constraint exists and update it
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'change_logs_entity_type_check'
  ) THEN
    ALTER TABLE public.change_logs 
      DROP CONSTRAINT change_logs_entity_type_check;
  END IF;
  
  ALTER TABLE public.change_logs 
    ADD CONSTRAINT change_logs_entity_type_check 
    CHECK (entity_type IN ('task', 'event', 'budget_item', 'change_request'));
  
  -- Update action constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'change_logs_action_check'
  ) THEN
    ALTER TABLE public.change_logs 
      DROP CONSTRAINT change_logs_action_check;
  END IF;
  
  ALTER TABLE public.change_logs 
    ADD CONSTRAINT change_logs_action_check 
    CHECK (action IN ('created', 'updated', 'deleted', 'approved', 'rejected', 'applied', 'cancelled'));
EXCEPTION
  WHEN OTHERS THEN
    -- Constraints might not exist, that's okay
    NULL;
END $$;


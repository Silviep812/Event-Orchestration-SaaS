-- app_role enum + labels: migration 20250814071751_ensure_app_role_enum_values.sql (separate txn avoids 55P04)

-- Create user roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Compare by text so RLS policies survive app_role enum renames (admin→host, event_manager→organizer, etc.)
CREATE OR REPLACE FUNCTION public.user_has_role_text(_user_id uuid, _role_names text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role::text = ANY(_role_names)
  )
$$;

DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM ('not_started', 'in_progress', 'completed', 'on_hold', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    assigned_role app_role,
    status task_status NOT NULL DEFAULT 'not_started',
    priority task_priority NOT NULL DEFAULT 'medium',
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    due_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE TYPE public.budget_category AS ENUM ('venue', 'catering', 'entertainment', 'decorations', 'transportation', 'marketing', 'supplies', 'services', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID,
    category budget_category NOT NULL,
    item_name TEXT NOT NULL,
    description TEXT,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    vendor_name TEXT,
    vendor_contact TEXT,
    payment_status TEXT DEFAULT 'pending',
    payment_due_date DATE,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.user_has_role_text(auth.uid(), ARRAY['admin', 'host', 'manager']));

DROP POLICY IF EXISTS "Users can view tasks assigned to them or created by them" ON public.tasks;
CREATE POLICY "Users can view tasks assigned to them or created by them"
ON public.tasks
FOR SELECT
USING (
    assigned_to = auth.uid() OR
    created_by = auth.uid() OR
    public.user_has_role_text(auth.uid(), ARRAY['admin', 'host', 'manager']) OR
    public.user_has_role_text(auth.uid(), ARRAY['event_manager', 'organizer', 'event_planner'])
);

DROP POLICY IF EXISTS "Event managers and admins can create tasks" ON public.tasks;
CREATE POLICY "Event managers and admins can create tasks"
ON public.tasks
FOR INSERT
WITH CHECK (
    public.user_has_role_text(auth.uid(), ARRAY['admin', 'host', 'manager']) OR
    public.user_has_role_text(auth.uid(), ARRAY['event_manager', 'organizer', 'event_planner']) OR
    public.user_has_role_text(auth.uid(), ARRAY['task_coordinator', 'event_planner'])
);

DROP POLICY IF EXISTS "Users can update tasks assigned to them" ON public.tasks;
CREATE POLICY "Users can update tasks assigned to them"
ON public.tasks
FOR UPDATE
USING (
    assigned_to = auth.uid() OR
    created_by = auth.uid() OR
    public.user_has_role_text(auth.uid(), ARRAY['admin', 'host', 'manager']) OR
    public.user_has_role_text(auth.uid(), ARRAY['event_manager', 'organizer', 'event_planner'])
);

DROP POLICY IF EXISTS "Users can view budget items for their events" ON public.budget_items;
CREATE POLICY "Users can view budget items for their events"
ON public.budget_items
FOR SELECT
USING (
    created_by = auth.uid() OR
    public.user_has_role_text(auth.uid(), ARRAY['admin', 'host', 'manager']) OR
    public.user_has_role_text(auth.uid(), ARRAY['event_manager', 'organizer', 'event_planner']) OR
    public.user_has_role_text(auth.uid(), ARRAY['budget_manager', 'event_planner'])
);

DROP POLICY IF EXISTS "Budget managers and admins can manage budget items" ON public.budget_items;
CREATE POLICY "Budget managers and admins can manage budget items"
ON public.budget_items
FOR ALL
USING (
    public.user_has_role_text(auth.uid(), ARRAY['admin', 'host', 'manager']) OR
    public.user_has_role_text(auth.uid(), ARRAY['event_manager', 'organizer', 'event_planner']) OR
    public.user_has_role_text(auth.uid(), ARRAY['budget_manager', 'event_planner'])
);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_items_updated_at ON public.budget_items;
CREATE TRIGGER update_budget_items_updated_at
    BEFORE UPDATE ON public.budget_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

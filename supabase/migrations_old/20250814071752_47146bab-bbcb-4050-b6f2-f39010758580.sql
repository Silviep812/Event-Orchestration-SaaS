-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'event_manager', 'vendor_coordinator', 'budget_manager', 'task_coordinator', 'client');

-- Create user roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create task status enum
CREATE TYPE public.task_status AS ENUM ('not_started', 'in_progress', 'completed', 'on_hold', 'cancelled');

-- Create task priority enum  
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create tasks table
CREATE TABLE public.tasks (
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

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create budget categories enum
CREATE TYPE public.budget_category AS ENUM ('venue', 'catering', 'entertainment', 'decorations', 'transportation', 'marketing', 'supplies', 'services', 'other');

-- Create budget items table
CREATE TABLE public.budget_items (
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

-- Enable RLS on budget_items
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create RLS policies for tasks
CREATE POLICY "Users can view tasks assigned to them or created by them"
ON public.tasks
FOR SELECT
USING (
    assigned_to = auth.uid() OR 
    created_by = auth.uid() OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'event_manager')
);

CREATE POLICY "Event managers and admins can create tasks"
ON public.tasks
FOR INSERT
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'event_manager') OR
    public.has_role(auth.uid(), 'task_coordinator')
);

CREATE POLICY "Users can update tasks assigned to them"
ON public.tasks
FOR UPDATE
USING (
    assigned_to = auth.uid() OR
    created_by = auth.uid() OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'event_manager')
);

-- Create RLS policies for budget_items
CREATE POLICY "Users can view budget items for their events"
ON public.budget_items
FOR SELECT
USING (
    created_by = auth.uid() OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'event_manager') OR
    public.has_role(auth.uid(), 'budget_manager')
);

CREATE POLICY "Budget managers and admins can manage budget items"
ON public.budget_items
FOR ALL
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'event_manager') OR
    public.has_role(auth.uid(), 'budget_manager')
);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_items_updated_at
    BEFORE UPDATE ON public.budget_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
-- Update RLS policies for budget_items to allow authenticated users to create items
DROP POLICY IF EXISTS "Budget managers and admins can manage budget items" ON public.budget_items;
DROP POLICY IF EXISTS "Users can view budget items for their events" ON public.budget_items;

-- Allow users to create budget items where they are the creator
CREATE POLICY "Users can create their own budget items" ON public.budget_items
  FOR INSERT 
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Allow users to view budget items they created or items for events they own
CREATE POLICY "Users can view their budget items" ON public.budget_items
  FOR SELECT 
  TO authenticated
  USING (
    created_by = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM "Create Event" 
      WHERE "Create Event".userid = auth.uid()::text 
      AND "Create Event".created_at::date = budget_items.created_at::date
    )
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'event_manager'::app_role)
  );

-- Allow users to update budget items they created
CREATE POLICY "Users can update their own budget items" ON public.budget_items
  FOR UPDATE 
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Allow users to delete budget items they created
CREATE POLICY "Users can delete their own budget items" ON public.budget_items
  FOR DELETE 
  TO authenticated
  USING (created_by = auth.uid());

-- Allow admins and managers to manage all budget items
CREATE POLICY "Admins and managers can manage all budget items" ON public.budget_items
  FOR ALL 
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'event_manager'::app_role) 
    OR has_role(auth.uid(), 'budget_manager'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'event_manager'::app_role) 
    OR has_role(auth.uid(), 'budget_manager'::app_role)
  );
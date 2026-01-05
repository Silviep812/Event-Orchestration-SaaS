-- Add SELECT policy for budget_items so users can view budget items for events they created
CREATE POLICY "Users can view budget items for their events" 
ON public.budget_items 
FOR SELECT 
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 
    FROM public."Create Event" ce 
    WHERE ce.userid = (auth.uid())::text
  )
);
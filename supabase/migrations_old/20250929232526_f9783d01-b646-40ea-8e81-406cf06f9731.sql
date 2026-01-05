-- Add SELECT policy for change_logs so users can view logs they created
CREATE POLICY "Users can view their own change logs"
ON public.change_logs
FOR SELECT
USING (changed_by = auth.uid());
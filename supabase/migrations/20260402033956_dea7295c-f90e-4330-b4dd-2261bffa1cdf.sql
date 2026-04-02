-- Add UPDATE policy for tasks_assignments: owners can update their own assignments
CREATE POLICY "Users can update own task assignments"
ON public.tasks_assignments
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Add DELETE policy for tasks_assignments: owners can delete their own assignments
CREATE POLICY "Users can delete own task assignments"
ON public.tasks_assignments
FOR DELETE
TO authenticated
USING (created_by = auth.uid());
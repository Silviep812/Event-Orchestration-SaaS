
-- Add roles array and permission_level text to collaborator_configurations
ALTER TABLE public.collaborator_configurations
  ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS permission_level_text TEXT DEFAULT 'R';

-- Add policy allowing event owners to update change requests for their events
CREATE POLICY "Event owners can update change requests"
ON public.change_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = change_requests.event_id::uuid
    AND events.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = change_requests.event_id::uuid
    AND events.user_id = auth.uid()
  )
);

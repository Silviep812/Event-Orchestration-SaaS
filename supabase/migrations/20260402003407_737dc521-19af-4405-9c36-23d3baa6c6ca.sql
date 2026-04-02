-- Fix 1: Scope notifications INSERT policy
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
CREATE POLICY "notifications_insert_scoped"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND (
    recipient_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = notifications.recipient_id
        AND (notifications.event_id IS NULL OR ur.event_id = notifications.event_id OR ur.event_id IS NULL)
    )
  )
);

-- Fix 2: Set search_path on update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix 3: Tighten change_requests UPDATE WITH CHECK
DROP POLICY IF EXISTS "cr_update_own" ON public.change_requests;
CREATE POLICY "cr_update_own"
ON public.change_requests FOR UPDATE TO authenticated
USING (requested_by = auth.uid())
WITH CHECK (requested_by = auth.uid());
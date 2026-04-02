-- Fix: Change cm_audit_insert_contrib policy from public to authenticated role
DROP POLICY IF EXISTS "cm_audit_insert_contrib" ON public.cm_audit_events;

CREATE POLICY "cm_audit_insert_contrib" ON public.cm_audit_events
  FOR INSERT TO authenticated
  WITH CHECK (
    (event_id IS NULL)
    OR EXISTS (
      SELECT 1 FROM public.cm_event_members em
      WHERE em.user_id = auth.uid()
        AND em.event_id = cm_audit_events.event_id
        AND em.role = ANY (ARRAY['contributor', 'manager'])
    )
  );
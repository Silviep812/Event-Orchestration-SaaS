-- Fix 1: cm_audit_insert_contrib - self-referential condition
DROP POLICY IF EXISTS "cm_audit_insert_contrib" ON public.cm_audit_events;

CREATE POLICY "cm_audit_insert_contrib" ON public.cm_audit_events
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() IS NOT NULL)
    AND (
      (event_id IS NULL)
      OR EXISTS (
        SELECT 1 FROM public.cm_event_members em
        WHERE em.user_id = auth.uid()
          AND em.event_id = cm_audit_events.event_id
          AND em.role = ANY (ARRAY['contributor', 'manager'])
      )
    )
  );

-- Fix 2: cm_audit_select_own_or_event - same self-referential bug in the em subquery
DROP POLICY IF EXISTS "cm_audit_select_own_or_event" ON public.cm_audit_events;

CREATE POLICY "cm_audit_select_own_or_event" ON public.cm_audit_events
  FOR SELECT TO authenticated
  USING (
    (user_id IS NOT NULL AND user_id::text = auth.uid()::text)
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id::text = cm_audit_events.event_id::text
        AND e.user_id::text = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM cm_event_members em
      WHERE em.user_id = auth.uid()
        AND em.event_id = cm_audit_events.event_id
    )
  );
-- ============================================
-- FINAL SECURITY HARDENING - Remaining Items
-- ============================================

-- Part 1: Fix remaining views (SECURITY INVOKER)
ALTER VIEW public.unified_tasks SET (security_invoker = on);
ALTER VIEW public.create_event_safe SET (security_invoker = on);

-- Part 2: Add RLS policies for Event Plan Report (retry - wasn't applied in failed migration)
CREATE POLICY "Users can view own event plan reports"
ON public."Event Plan Report" FOR SELECT TO authenticated
USING (userid = auth.uid());

CREATE POLICY "Users can create own event plan reports"
ON public."Event Plan Report" FOR INSERT TO authenticated
WITH CHECK (userid = auth.uid());

CREATE POLICY "Users can update own event plan reports"
ON public."Event Plan Report" FOR UPDATE TO authenticated
USING (userid = auth.uid())
WITH CHECK (userid = auth.uid());

CREATE POLICY "Users can delete own event plan reports"
ON public."Event Plan Report" FOR DELETE TO authenticated
USING (userid = auth.uid());

-- Part 3: Fix execute_raw_sql search_path (recreate to ensure it takes effect)
DROP FUNCTION IF EXISTS public.execute_raw_sql(text);

CREATE FUNCTION public.execute_raw_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    result JSONB;
BEGIN
    EXECUTE query INTO result;
    RETURN result;
END;
$$;
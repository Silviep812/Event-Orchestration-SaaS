-- ============================================
-- COMPLETE SECURITY HARDENING MIGRATION (Fixed)
-- ============================================

-- Part 3a: Fix assert_user_in_event (drop first due to parameter name change)
DROP FUNCTION IF EXISTS public.assert_user_in_event(uuid);

CREATE FUNCTION public.assert_user_in_event(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.events
    WHERE id = p_event_id
    AND (
      created_by = auth.uid()
      OR has_permission_level(auth.uid(), 'admin'::permission_level)
      OR has_permission_level(auth.uid(), 'coordinator'::permission_level, p_event_id)
    )
  ) THEN
    RAISE EXCEPTION 'Access denied to event %', p_event_id USING ERRCODE = '42501';
  END IF;
END;
$$;

-- Part 3b: Fix approve_change_request_wr
CREATE OR REPLACE FUNCTION public.approve_change_request_wr(change_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ev uuid;
BEGIN
  SELECT event_id INTO ev
  FROM public.change_requests
  WHERE id = change_request_id;

  IF ev IS NULL THEN
    RAISE EXCEPTION 'No event found for change_request %', change_request_id USING ERRCODE = '23514';
  END IF;

  PERFORM public.assert_user_in_event(ev);
  PERFORM public.approve_change_request(change_request_id);
END;
$$;

-- Part 3c: Fix apply_change_request_wr
CREATE OR REPLACE FUNCTION public.apply_change_request_wr(change_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ev uuid;
BEGIN
  SELECT event_id INTO ev
  FROM public.change_requests
  WHERE id = change_request_id;

  IF ev IS NULL THEN
    RAISE EXCEPTION 'No event found for change_request %', change_request_id USING ERRCODE = '23514';
  END IF;

  PERFORM public.assert_user_in_event(ev);
  PERFORM public.apply_change_request(change_request_id);
END;
$$;

-- Part 3d: Fix cancel_change_request_wr
CREATE OR REPLACE FUNCTION public.cancel_change_request_wr(change_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ev uuid;
BEGIN
  SELECT event_id INTO ev
  FROM public.change_requests
  WHERE id = change_request_id;

  IF ev IS NULL THEN
    RAISE EXCEPTION 'No event found for change_request %', change_request_id USING ERRCODE = '23514';
  END IF;

  PERFORM public.assert_user_in_event(ev);
  PERFORM public.cancel_change_request(change_request_id);
END;
$$;
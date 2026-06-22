
-- Enable RLS on realtime.messages (Supabase Realtime Authorization)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Helper: does the current authenticated user have access to this channel topic?
CREATE OR REPLACE FUNCTION public.user_can_access_realtime_topic(p_topic text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      -- Coordinators / admins get full Realtime access for operational channels
      public.has_min_permission_level(auth.uid(), 'coordinator'::permission_level)
      -- User-scoped channels: topic must contain the caller's uid
      OR position(auth.uid()::text in p_topic) > 0
      -- Event-scoped channels: topic must contain an event id the caller is a member of
      OR EXISTS (
        SELECT 1
        FROM public.cm_event_members m
        WHERE m.user_id = auth.uid()
          AND position(m.event_id::text in p_topic) > 0
      )
    )
$$;

GRANT EXECUTE ON FUNCTION public.user_can_access_realtime_topic(text) TO authenticated;

-- Drop any prior policies (idempotent)
DROP POLICY IF EXISTS "Authenticated users can read authorized channels" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can publish to authorized channels" ON realtime.messages;

-- SELECT (subscribe / receive)
CREATE POLICY "Authenticated users can read authorized channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.user_can_access_realtime_topic(realtime.topic())
);

-- INSERT (publish broadcasts / presence)
CREATE POLICY "Authenticated users can publish to authorized channels"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_can_access_realtime_topic(realtime.topic())
);

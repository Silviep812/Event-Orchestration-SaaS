
-- Fix 1: discussion_comments SELECT policy — remove global coordinator branch.
-- The 3-arg has_min_permission_level treats a NULL event_id role as matching ANY event,
-- which lets a globally-scoped coordinator read comments for any event. Require true
-- event membership (or own row, or admin) to read.
DROP POLICY IF EXISTS "Users read scoped discussion comments" ON public.discussion_comments;

CREATE POLICY "Users read scoped discussion comments"
ON public.discussion_comments
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR has_permission_level(auth.uid(), 'admin'::permission_level)
  OR (
    entity_type = 'event'
    AND entity_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND user_is_member_of_event((entity_id)::uuid)
  )
);

-- Fix 2: marketing_subscribers — add case-insensitive uniqueness to prevent
-- anonymous flood/duplicates and reinforce the recency anti-relay check.
CREATE UNIQUE INDEX IF NOT EXISTS marketing_subscribers_email_lower_uidx
  ON public.marketing_subscribers ((lower(trim(email))));

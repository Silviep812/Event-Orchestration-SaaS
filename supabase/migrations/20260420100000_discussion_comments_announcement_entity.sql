-- Team Communication Hub: broadcast-style posts scoped to an event (entity_id = event id).
ALTER TABLE public.discussion_comments
  DROP CONSTRAINT IF EXISTS discussion_comments_entity_type_check;

ALTER TABLE public.discussion_comments
  ADD CONSTRAINT discussion_comments_entity_type_check
  CHECK (entity_type IN ('event', 'task', 'general', 'announcement'));

NOTIFY pgrst, 'reload schema';

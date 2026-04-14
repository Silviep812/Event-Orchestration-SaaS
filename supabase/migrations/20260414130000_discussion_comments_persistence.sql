-- Persisted discussion threads for the Comments page (attachments + mentions + likes).
-- Separate from legacy public."Comments" (different shape; used elsewhere).

CREATE TABLE IF NOT EXISTS public.discussion_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.discussion_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  entity_type text NOT NULL DEFAULT 'general' CHECK (entity_type IN ('event', 'task', 'general')),
  entity_id text NOT NULL DEFAULT 'general',
  entity_title text NOT NULL DEFAULT 'General Discussion',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  mentions text[] NOT NULL DEFAULT '{}',
  is_edited boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discussion_comments_parent_id ON public.discussion_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_created_at ON public.discussion_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_user_id ON public.discussion_comments(user_id);

CREATE TABLE IF NOT EXISTS public.discussion_comment_likes (
  comment_id uuid NOT NULL REFERENCES public.discussion_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_discussion_comment_likes_user ON public.discussion_comment_likes(user_id);

ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read discussion comments" ON public.discussion_comments;
CREATE POLICY "Authenticated users can read discussion comments"
ON public.discussion_comments FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users insert own discussion comments" ON public.discussion_comments;
CREATE POLICY "Users insert own discussion comments"
ON public.discussion_comments FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own discussion comments" ON public.discussion_comments;
CREATE POLICY "Users update own discussion comments"
ON public.discussion_comments FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete own or coordinator discussion comments" ON public.discussion_comments;
CREATE POLICY "Users delete own or coordinator discussion comments"
ON public.discussion_comments FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_min_permission_level(auth.uid(), 'coordinator'::public.permission_level)
);

DROP POLICY IF EXISTS "Authenticated users can read discussion likes" ON public.discussion_comment_likes;
CREATE POLICY "Authenticated users can read discussion likes"
ON public.discussion_comment_likes FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users insert own discussion likes" ON public.discussion_comment_likes;
CREATE POLICY "Users insert own discussion likes"
ON public.discussion_comment_likes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete own discussion likes" ON public.discussion_comment_likes;
CREATE POLICY "Users delete own discussion likes"
ON public.discussion_comment_likes FOR DELETE TO authenticated
USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.discussion_comments TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.discussion_comment_likes TO authenticated;

-- Storage for comment attachments (paths: {auth.uid()}/...)
INSERT INTO storage.buckets (id, name, public)
VALUES ('comment-attachments', 'comment-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Anyone can view comment attachments" ON storage.objects;
CREATE POLICY "Anyone can view comment attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'comment-attachments');

DROP POLICY IF EXISTS "Users upload own comment attachments" ON storage.objects;
CREATE POLICY "Users upload own comment attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'comment-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users delete own comment attachments" ON storage.objects;
CREATE POLICY "Users delete own comment attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'comment-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

NOTIFY pgrst, 'reload schema';

-- Deliverable 2: uploads metadata, extended cm_change_requests, notification columns,
-- reporting views, trial selection junction, activity_feed alias, email_events audit.

-- ─── uploads (Supabase Storage companion metadata) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  media_type text,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON public.uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_event_id ON public.uploads(event_id);

ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS uploads_owner_all ON public.uploads;
CREATE POLICY uploads_owner_all
ON public.uploads
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

REVOKE ALL ON public.uploads FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.uploads TO authenticated;

-- ─── cm_change_requests: deliverable field-level + approval workflow ─────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cm_change_requests'
  ) THEN
    ALTER TABLE public.cm_change_requests ADD COLUMN IF NOT EXISTS field_changed text;
    ALTER TABLE public.cm_change_requests ADD COLUMN IF NOT EXISTS old_value text;
    ALTER TABLE public.cm_change_requests ADD COLUMN IF NOT EXISTS new_value text;
    ALTER TABLE public.cm_change_requests ADD COLUMN IF NOT EXISTS status text
      DEFAULT 'pending';
    ALTER TABLE public.cm_change_requests ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
    ALTER TABLE public.cm_change_requests ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- ─── notifications: optional event + channel + sent audit ────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id) ON DELETE SET NULL;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS channel text;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS sent_at timestamptz;
  END IF;
END $$;

-- ─── email_events: provider-agnostic send log (Deliverable 2 + marketing PDF) ─
CREATE TABLE IF NOT EXISTS public.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  template text NOT NULL,
  recipient text NOT NULL,
  provider text DEFAULT 'resend',
  status text NOT NULL DEFAULT 'sent',
  error text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_events_created ON public.email_events(created_at DESC);

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS email_events_owner_read ON public.email_events;
CREATE POLICY email_events_owner_read
ON public.email_events
FOR SELECT
TO authenticated
USING (
  user_id IS NOT NULL AND user_id = auth.uid()
);

DROP POLICY IF EXISTS email_events_system_insert ON public.email_events;
CREATE POLICY email_events_system_insert
ON public.email_events
FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

REVOKE ALL ON public.email_events FROM anon;
GRANT SELECT, INSERT ON public.email_events TO authenticated;

-- ─── Trial / PDF: unified selection rows (resources / venue / vendor semantics) ─
CREATE TABLE IF NOT EXISTS public.event_resource_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL,
  selection_type text NOT NULL CHECK (selection_type IN ('resource', 'venue', 'vendor', 'hospitality', 'other')),
  status text NOT NULL DEFAULT 'selected',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, resource_id, selection_type)
);

CREATE INDEX IF NOT EXISTS idx_event_resource_selections_event ON public.event_resource_selections(event_id);

ALTER TABLE public.event_resource_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_resource_selections_scoped ON public.event_resource_selections;
CREATE POLICY event_resource_selections_scoped
ON public.event_resource_selections
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_resource_selections.event_id AND e.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_resource_selections.event_id AND e.user_id = auth.uid()
  )
);

REVOKE ALL ON public.event_resource_selections FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_resource_selections TO authenticated;

-- ─── Views (security_invoker so RLS on base tables applies) ───────────────────
DROP VIEW IF EXISTS public.activity_feed;
CREATE VIEW public.activity_feed
WITH (security_invoker = true) AS
SELECT
  id,
  event_id,
  entity_type,
  entity_id,
  action,
  changed_by,
  metadata,
  created_at
FROM public.cm_activity;

REVOKE ALL ON public.activity_feed FROM anon;
GRANT SELECT ON public.activity_feed TO authenticated;

DROP VIEW IF EXISTS public.due_soon_events;
CREATE VIEW public.due_soon_events
WITH (security_invoker = true) AS
SELECT e.*
FROM public.events e
WHERE e.archived IS NOT TRUE
  AND e.start_date IS NOT NULL
  AND e.start_date::date <= (CURRENT_DATE + 2)
  AND e.start_date::date >= CURRENT_DATE;

REVOKE ALL ON public.due_soon_events FROM anon;
GRANT SELECT ON public.due_soon_events TO authenticated;

DROP VIEW IF EXISTS public.vendor_category_counts;
CREATE VIEW public.vendor_category_counts
WITH (security_invoker = true) AS
SELECT
  e.user_id AS owner_id,
  e.id AS event_id,
  ers.selection_type,
  count(*)::bigint AS selection_count
FROM public.events e
JOIN public.event_resource_selections ers ON ers.event_id = e.id
WHERE ers.selection_type IN ('vendor', 'hospitality', 'resource')
GROUP BY e.user_id, e.id, ers.selection_type;

REVOKE ALL ON public.vendor_category_counts FROM anon;
GRANT SELECT ON public.vendor_category_counts TO authenticated;

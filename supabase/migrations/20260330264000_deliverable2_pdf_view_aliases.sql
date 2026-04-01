-- Deliverable 2 / Workflow Setup PDF naming: expose event_resources as a view over
-- event_resource_selections. change_requests already exists as a real table in this
-- DB so we skip creating a duplicate view for it.

-- ─── event_resources view ────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'change_requests'
      AND table_type = 'BASE TABLE'
  ) THEN
    -- Only drop view if it is not a table (safe re-run)
    EXECUTE 'DROP VIEW IF EXISTS public.event_resources';
  END IF;
END $$;

DROP VIEW IF EXISTS public.event_resources;
CREATE VIEW public.event_resources
WITH (security_invoker = true) AS
SELECT
  id,
  event_id,
  resource_id,
  status,
  selection_type,
  notes,
  created_at,
  updated_at
FROM public.event_resource_selections;

REVOKE ALL ON public.event_resources FROM anon;
GRANT SELECT ON public.event_resources TO authenticated;

-- ─── change_requests: already a real table — no view needed ──────────────────
-- The existing public.change_requests table satisfies the PDF naming requirement.
-- Ensure RLS is enabled and anon is revoked (idempotent).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'change_requests'
  ) THEN
    EXECUTE 'ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON public.change_requests FROM anon';
  END IF;
END $$;

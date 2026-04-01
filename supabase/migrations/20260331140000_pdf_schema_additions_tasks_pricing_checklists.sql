-- PDF / deliverable alignment: additive columns + check_lists (safe IF NOT EXISTS).

-- ── tasks: role columns (PDF checklist) ───────────────────────────────────────
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_bookings_role text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_service_rental_role text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_hospitality_role text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_entertainment_role text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_transportation_role text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_external_vendor_role text;

-- ── pricing / profile fields ─────────────────────────────────────────────────
ALTER TABLE public.amenity_types ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS supplier_cost numeric;
ALTER TABLE public.transportations ADD COLUMN IF NOT EXISTS profile_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_level text;

-- ── check_lists (per-resource checklists, event-scoped for RLS) ───────────────
CREATE TABLE IF NOT EXISTS public.check_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  resource_id text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_check_lists_event ON public.check_lists(event_id);
CREATE INDEX IF NOT EXISTS idx_check_lists_resource ON public.check_lists(event_id, resource_type, resource_id);

ALTER TABLE public.check_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS check_lists_event_owner_all ON public.check_lists;
CREATE POLICY check_lists_event_owner_all
ON public.check_lists FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = check_lists.event_id AND e.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = check_lists.event_id AND e.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS check_lists_collaborator_select ON public.check_lists;
CREATE POLICY check_lists_collaborator_select
ON public.check_lists FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.event_id = check_lists.event_id
  )
);

DROP POLICY IF EXISTS check_lists_sysadmin_select ON public.check_lists;
CREATE POLICY check_lists_sysadmin_select
ON public.check_lists FOR SELECT TO authenticated
USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));

REVOKE ALL ON public.check_lists FROM anon;

-- updated_at
DROP TRIGGER IF EXISTS set_updated_at_check_lists ON public.check_lists;
CREATE TRIGGER set_updated_at_check_lists
  BEFORE UPDATE ON public.check_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

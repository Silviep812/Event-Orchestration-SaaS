-- Milestone 5: Unified System Merger
-- Merges Project Management and Manage Event into one unified event-centric system.
-- Adds organizations + organization_members for multi-tenant control (Merger Plan Phase 3).
-- All operations are idempotent.
BEGIN;

-- ── 1) Organizations (multi-tenant control) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_select_members" ON public.organizations;
CREATE POLICY "org_select_members" ON public.organizations
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "org_insert_authenticated" ON public.organizations;
CREATE POLICY "org_insert_authenticated" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "org_update_owner" ON public.organizations;
CREATE POLICY "org_update_owner" ON public.organizations
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

-- ── 2) Organization Members (RBAC layer) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'host' CHECK (role IN (
    'host', 'planner', 'venue_owner', 'hospitality', 'collaborator'
  )),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orgmem_select_same_org" ON public.organization_members;
CREATE POLICY "orgmem_select_same_org" ON public.organization_members
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members om WHERE om.user_id = auth.uid()
    )
    OR organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "orgmem_insert_org_owner" ON public.organization_members;
CREATE POLICY "orgmem_insert_org_owner" ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "orgmem_delete_org_owner" ON public.organization_members;
CREATE POLICY "orgmem_delete_org_owner" ON public.organization_members
  FOR DELETE TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- ── 3) Link events to organizations (optional FK — existing events keep working)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

-- ── 4) Ensure tasks have event_id (already exists) + organization_id for cross-event queries
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

-- ── 5) Auto-create default org for existing event owners who don't have one
-- (Handled at app level: when user first accesses portfolio dashboard, create org if needed)

-- ── 6) Updated-at trigger for organizations
DROP TRIGGER IF EXISTS trg_organizations_updated_at ON public.organizations;
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;

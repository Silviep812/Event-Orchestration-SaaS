-- Marketing Campaign Binder PDF — automation schema (subscribers, campaigns, deliveries, conversions)
-- Uses gen_random_uuid(); delivery table is named marketing_email_deliveries to avoid clashing with transactional email_events.

-- ─── marketing_subscribers ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketing_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  user_type text,
  organization text,
  signup_source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketing_subscribers_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_marketing_subscribers_created ON public.marketing_subscribers(created_at DESC);

-- ─── marketing_campaigns ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name text,
  campaign_type text,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── marketing_emails ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketing_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  email_name text,
  subject_line text,
  send_day integer,
  template_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_emails_campaign ON public.marketing_emails(campaign_id);

-- PDF: email_delivery — campaign sends to subscribers (distinct from transactional email_events)
CREATE TABLE IF NOT EXISTS public.marketing_email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES public.marketing_subscribers(id) ON DELETE CASCADE,
  email_id uuid REFERENCES public.marketing_emails(id) ON DELETE SET NULL,
  sent_at timestamptz,
  opened boolean NOT NULL DEFAULT false,
  clicked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_email_deliveries_sent ON public.marketing_email_deliveries(sent_at DESC);

-- ─── marketing_conversions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketing_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid REFERENCES public.marketing_subscribers(id) ON DELETE SET NULL,
  conversion_type text,
  conversion_date timestamptz NOT NULL DEFAULT now(),
  value numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.marketing_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_email_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_conversions ENABLE ROW LEVEL SECURITY;

-- Landing / waitlist: anonymous insert with basic email validation
DROP POLICY IF EXISTS marketing_subscribers_anon_insert ON public.marketing_subscribers;
CREATE POLICY marketing_subscribers_anon_insert
ON public.marketing_subscribers
FOR INSERT
TO anon
WITH CHECK (
  email IS NOT NULL
  AND length(trim(email)) > 3
  AND position('@' IN trim(email)) > 1
);

-- Admins: full access to marketing data
DROP POLICY IF EXISTS marketing_subscribers_admin ON public.marketing_subscribers;
CREATE POLICY marketing_subscribers_admin
ON public.marketing_subscribers
FOR ALL
TO authenticated
USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level))
WITH CHECK (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));

DROP POLICY IF EXISTS marketing_campaigns_admin ON public.marketing_campaigns;
CREATE POLICY marketing_campaigns_admin
ON public.marketing_campaigns
FOR ALL
TO authenticated
USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level))
WITH CHECK (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));

DROP POLICY IF EXISTS marketing_emails_admin ON public.marketing_emails;
CREATE POLICY marketing_emails_admin
ON public.marketing_emails
FOR ALL
TO authenticated
USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level))
WITH CHECK (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));

DROP POLICY IF EXISTS marketing_email_deliveries_admin ON public.marketing_email_deliveries;
CREATE POLICY marketing_email_deliveries_admin
ON public.marketing_email_deliveries
FOR ALL
TO authenticated
USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level))
WITH CHECK (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));

DROP POLICY IF EXISTS marketing_conversions_admin ON public.marketing_conversions;
CREATE POLICY marketing_conversions_admin
ON public.marketing_conversions
FOR ALL
TO authenticated
USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level))
WITH CHECK (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));

REVOKE ALL ON public.marketing_subscribers FROM anon;
GRANT INSERT ON public.marketing_subscribers TO anon;

REVOKE ALL ON public.marketing_campaigns FROM anon;
REVOKE ALL ON public.marketing_emails FROM anon;
REVOKE ALL ON public.marketing_email_deliveries FROM anon;
REVOKE ALL ON public.marketing_conversions FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_subscribers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_emails TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_email_deliveries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_conversions TO authenticated;

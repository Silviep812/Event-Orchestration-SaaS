-- Task 2B: billing schema for the Stripe integration.
--
-- Schema only. No Stripe account, price ids or API keys exist yet, so this creates the
-- tables the edge functions write to and nothing else. Applying it changes no existing
-- behaviour: every table is new, and public.profiles gains three nullable columns.
--
-- Design decisions worth stating, because they are easy to get wrong later:
--
--  * stripe_webhook_events is an idempotency ledger, not a log. Stripe retries delivery on
--    any non-2xx, and a retried invoice.paid must not create a second invoice row or
--    re-grant a subscription period. The handler inserts the event id FIRST and lets the
--    primary key reject the duplicate.
--
--  * Subscription state lives on profiles, not in a separate subscriptions table. The app
--    already reads profiles.subscription_plan/status everywhere, and one user has one
--    subscription here. Adding a table would mean two sources of truth for "is this user Pro".
--
--  * No prices/products tables. Stripe is the catalogue; mirroring it locally invites drift.
--    Price ids belong in edge function config.
--
--  * Clients get SELECT on their own rows and nothing more. Every write goes through an edge
--    function using the service role, because only a Stripe-signed webhook may change billing
--    state. A client that could UPDATE its own subscription_plan could self-upgrade to Pro.

-- ---------------------------------------------------------------------------
-- 1. Stripe customer mapping
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.stripe_customers (
  user_id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL UNIQUE,
  email              text,
  livemode           boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.stripe_customers IS
  'Maps an IEP user to their Stripe customer. livemode distinguishes test-mode rows from live ones.';

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stripe_customers_select_own" ON public.stripe_customers;
CREATE POLICY "stripe_customers_select_own"
  ON public.stripe_customers FOR SELECT
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. Webhook idempotency ledger
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id            text PRIMARY KEY,           -- Stripe's evt_… id; the idempotency key
  type          text NOT NULL,
  livemode      boolean NOT NULL DEFAULT false,
  payload       jsonb,
  received_at   timestamptz NOT NULL DEFAULT now(),
  processed_at  timestamptz,
  error         text
);

COMMENT ON TABLE public.stripe_webhook_events IS
  'Idempotency ledger. The webhook inserts the Stripe event id before doing any work; a '
  'duplicate delivery collides on the primary key and is acknowledged without reprocessing.';

CREATE INDEX IF NOT EXISTS stripe_webhook_events_unprocessed_idx
  ON public.stripe_webhook_events (received_at)
  WHERE processed_at IS NULL;

-- No policies: service role only. RLS on with zero policies denies every client.
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. Subscription state on profiles
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS current_period_end     timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end   boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_subscription_id_key
  ON public.profiles (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

COMMENT ON COLUMN public.profiles.cancel_at_period_end IS
  'True once a subscriber cancels: access continues until current_period_end, then reverts to starter.';

-- ---------------------------------------------------------------------------
-- 4. Invoices: make webhook upserts idempotent
-- ---------------------------------------------------------------------------

-- The invoice.paid handler upserts on stripe_invoice_id. Without a unique index a retried
-- delivery that slips past the ledger would insert a duplicate invoice for the same charge.
CREATE UNIQUE INDEX IF NOT EXISTS invoices_stripe_invoice_id_key
  ON public.invoices (stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS invoices_user_id_created_at_idx
  ON public.invoices (user_id, created_at DESC);

-- invoice_number is customer-facing and nothing generates it today. A sequence keeps it
-- monotonic and gap-tolerant; the webhook formats it as IEP-000001.
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq AS bigint START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'IEP-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0');
$$;

REVOKE ALL ON FUNCTION public.next_invoice_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_invoice_number() TO service_role;

-- ---------------------------------------------------------------------------
-- 5. Downgrade helper
-- ---------------------------------------------------------------------------

-- Called by customer.subscription.deleted, and usable from a scheduled job to catch
-- subscriptions whose period simply lapsed without a delete event arriving.
CREATE OR REPLACE FUNCTION public.revert_expired_subscriptions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.profiles
  SET subscription_plan   = 'starter',
      subscription_status = 'active',
      stripe_subscription_id = NULL,
      cancel_at_period_end = false
  WHERE subscription_plan IS DISTINCT FROM 'starter'
    AND current_period_end IS NOT NULL
    AND current_period_end < now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.revert_expired_subscriptions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revert_expired_subscriptions() TO service_role;

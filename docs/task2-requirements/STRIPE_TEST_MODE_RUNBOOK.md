# Stripe test-mode runbook

> ## Update 2026-09-25 — a Stripe integration is already deployed
>
> Three functions are **ACTIVE** on the project but absent from this repo:
> `stripe-webhook`, `stripe-checkout`, `send-invoice` (all v4). Their sources have been
> recovered into [`supabase/functions/_recovered/`](../../supabase/functions/_recovered/).
>
> They are **inert**: `STRIPE_SECRET_KEY` is not set, so they return 500 before doing work.
>
> **Two defects found in the deployed webhook**, both detailed in the recovered README:
> 1. **The signature check is conditional** — `if (webhookSecret && signature) … else` trusts
>    unverified JSON. With `verify_jwt = false` and no webhook secret set, anyone who knows the
>    URL could grant themselves a paid plan. **Setting `STRIPE_SECRET_KEY` without also setting
>    `STRIPE_WEBHOOK_SECRET` would open this.**
> 2. **No idempotency guard** — a bare insert, so a redelivered event duplicates the invoice
>    and re-extends the subscription.
>
> **Do step 2 (secrets) in full or not at all** — never the Stripe key alone.
>
> Before deploying anything, decide: replace the deployed trio with the new functions, or port
> the two fixes into them. Deploying the new ones overwrites live deployments.

Everything below runs in **test mode**. No live keys, no real charges. The scaffolding is
committed and inert until the secrets exist: each function returns HTTP 503
`stripe_not_configured` rather than failing obscurely.

## What is built

| Piece | Path | State |
|---|---|---|
| Billing schema | [`20260925195000_task2b_stripe_billing_schema.sql`](../../supabase/migrations/20260925195000_task2b_stripe_billing_schema.sql) | **Applied** (ledger 395) |
| Shared Stripe helpers | [`_shared/stripe.ts`](../../supabase/functions/_shared/stripe.ts) | Committed |
| Checkout | [`create-checkout-session`](../../supabase/functions/create-checkout-session/index.ts) | Committed, not deployed |
| Billing portal | [`create-billing-portal-session`](../../supabase/functions/create-billing-portal-session/index.ts) | Committed, not deployed |
| Webhook | [`stripe-webhook`](../../supabase/functions/stripe-webhook/index.ts) | Committed, not deployed |
| Entitlement rules | [`src/lib/subscriptionEntitlement.ts`](../../src/lib/subscriptionEntitlement.ts) | Committed, 9 tests |

**Not built yet** (needs the account first): the pricing/upgrade page, the post-checkout
return route, and the invoice email on `invoice.paid`.

---

## Step 1 — Stripe account (client action)

1. Create the account, complete business verification.
2. Toggle **Test mode** in the dashboard.
3. Create product **IEP Pro**, recurring price **$49.00 / month**. Copy the `price_…` id.
4. Starter needs no Stripe object — it is free, so it never reaches checkout.

## Step 2 — Secrets

Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```
STRIPE_SECRET_KEY      sk_test_…
STRIPE_WEBHOOK_SECRET  whsec_…      (from step 4)
STRIPE_PRICE_PRO       price_…      (from step 1)
APP_URL                https://idaeventpartners.com   # optional
```

> **Do not put these in `.env`.** That file is tracked in this repository's git history
> across 20 commits. A key added there is published to GitHub on the next commit. Supabase
> edge function secrets are the only correct home.

## Step 3 — Apply the schema — DONE

Applied 2026-09-25 and recorded in the ledger (now 395). Verified live:
`stripe_customers` (RLS on, 1 policy), `stripe_webhook_events` (RLS on, **0 policies** =
service-role only), the three new `profiles` columns, all four indexes, and
`next_invoice_number()` returning `IEP-000001`.

> The sequence was reset after that verification call, so the first real invoice still
> gets `IEP-000001`.

## Step 4 — Deploy and wire the webhook

> **This overwrites the deployed `stripe-webhook` (v4).** Confirm the replace-vs-port decision
> above first. The recovered copy is in `supabase/functions/_recovered/` if you need to revert,
> though it is an extracted entry module, not the original file.

```bash
npx supabase functions deploy stripe-webhook \
  create-checkout-session create-billing-portal-session
```

Then either point a dashboard endpoint at
`https://mavbnybtyfewfsihmuri.supabase.co/functions/v1/stripe-webhook`,
or forward locally:

```bash
stripe listen --forward-to \
  https://mavbnybtyfewfsihmuri.supabase.co/functions/v1/stripe-webhook
```

Subscribe to: `checkout.session.completed`, `customer.subscription.created`,
`customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`,
`invoice.payment_failed`.

`stripe listen` prints the `whsec_…` for step 2.

---

## Step 5 — Tests to actually run

### 5a. Happy path
Call `create-checkout-session` as a signed-in user, complete checkout with `4242 4242 4242 4242`.

Expect: `profiles.subscription_plan = 'pro'`, `subscription_status = 'active'`,
`stripe_subscription_id` set, `current_period_end` ≈ one month out, and a `paid` row in
`invoices` with an `IEP-000001`-style `invoice_number`.

### 5b. Idempotency — the one most likely to be skipped
```bash
stripe events resend <evt_id>
```
Expect: `{"received":true,"duplicate":true}`, and **no** second `invoices` row. Confirm
`select count(*) from invoices where stripe_invoice_id = '<in_…>'` is still 1.

This is the failure that silently double-bills in production. Test it.

### 5c. Signature rejection
```bash
curl -X POST .../stripe-webhook -H 'stripe-signature: t=1,v1=bogus' -d '{}'
```
Expect 400, and no row in `stripe_webhook_events`. An unsigned request must never write.

### 5d. Declined card
Use `4000 0000 0000 0341` (attaches, then fails on charge).
Expect `invoice.payment_failed` → an invoice row with `status = 'payment_failed'`, and the
subscription in `past_due` — which **still grants access** by design, since Stripe retries
for days. See `ENTITLED_STATUSES`.

### 5e. Cancellation
Cancel through the billing portal.
Expect `cancel_at_period_end = true` and access retained until `current_period_end`, then
`customer.subscription.deleted` reverts the profile to `starter`.

### 5f. RLS
As user A, query `invoices` and `stripe_customers`. User B's rows must not appear.
`stripe_webhook_events` must return nothing to any client — RLS is on with zero policies.

### 5g. Not-configured path
Before the secrets exist, each function must return 503 `stripe_not_configured`, not a 500.

---

## Design notes

**The webhook is the only writer of billing state.** Clients get `SELECT` on their own rows
and nothing else. A client that could `UPDATE` its own `subscription_plan` would self-upgrade
to Pro for free.

**Idempotency is claim-first.** The event id is inserted into `stripe_webhook_events` *before*
any work; a duplicate collides on the primary key and is acknowledged without reprocessing.
On failure the claim row is deleted so Stripe's retry is actually processed — but only when
`processed_at IS NULL`, so a successful handler whose bookkeeping update failed is never
re-applied.

**Subscription state lives on `profiles`.** The app already reads
`profiles.subscription_plan` everywhere. A separate `subscriptions` table would create two
sources of truth for "is this user Pro".

**No local `prices`/`products` mirror.** Stripe is the catalogue; a local copy invites drift.

**`past_due` keeps access on purpose.** Cutting a paying customer off at the first decline is
worse than carrying them through Stripe's retry window.

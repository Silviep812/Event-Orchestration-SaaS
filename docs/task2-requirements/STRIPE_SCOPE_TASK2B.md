# Task 2B — Stripe & Invoicing: scope assessment

Written 2026-09-25 against the live Supabase project (`mavbnybtyfewfsihmuri`) and `main`.

> **Headline:** the SOW lists these as *"Validate Stripe setup process"* and *"Validate User
> (subscribers) setup Invoicing system"*. There is no Stripe integration to validate. This is
> **build work, not validation**, and it is the largest schedule risk in Milestone 5.

---

## What already exists (more than expected)

The groundwork is genuinely in place, which shortens the build considerably:

| Piece | State |
|---|---|
| `invoices` table | 15 columns, including `stripe_invoice_id`, `billing_period_start/end`, `status`, `amount`, `invoice_number` |
| `invoices` RLS | `invoices_select_own` + `invoices_insert_admin` — correct shape already |
| `profiles` subscription columns | `subscription_plan`, `subscription_status`, `subscription_level`, `subscription_started_at`, `subscription_expires_at` |
| Live subscriber state | **All 37 profiles are `starter` / `active`** |
| Invoices UI | [`src/pages/Invoices.tsx`](../../src/pages/Invoices.tsx) exists and already reads the table |
| Pricing copy | [`src/lib/pricingSummaryCopy.ts`](../../src/lib/pricingSummaryCopy.ts) — "Starter: Free. Pro: $49/month…" |
| Resend | Domain `idaeventpartners.com` **verified**, sending enabled — invoice email can reuse it |

## What does not exist

| Gap | Evidence |
|---|---|
| Stripe SDK | No `stripe` dependency in `package.json` |
| Any Stripe code | Only two references repo-wide, both comments: *"no Stripe in Task 1"*, *"no Stripe wiring here"* |
| Stripe API key | Project secrets hold `RESEND_API_KEY`, `Sylvia_Key`, `LOVABLE_API_KEY` and the Supabase defaults — **no `STRIPE_SECRET_KEY`** |
| Checkout / billing portal | No route, no page, no edge function |
| Webhook handler | None of the 11 edge functions touches Stripe |
| Subscription tables | No `subscriptions`, `customers`, `prices`, `products`, `payment_methods`, `webhook_events` |
| Invoice data | `invoices` has **0 rows**; no generation path |
| Plan catalogue data | `Subscription_Plans Directory` and `Subscription_Plans Profile` are both **0 rows** |

---

## Build plan

Ordered so each step is independently testable.

### 1. Account and configuration *(client action — blocks everything)*
- Stripe account, business verification, bank payout details.
- Create the **Pro** product and its $49/month price; record the price id.
- Decide the Starter plan's Stripe representation — a $0 price, or no Stripe object at all.
  Recommend **no Stripe object**: Starter is free, so a checkout it never uses is dead weight.
- Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to Supabase edge function secrets.
  **Never** in `.env` — see the note below.
- Vendor Marketplace tiers (A9) need their own products if Task 2B is to cover them:
  Featured $49–99/mo, Premium Partner $199–499/mo.

### 2. Schema
- `stripe_customers` — maps `auth.users.id` → Stripe customer id, one row per user, RLS `select_own`.
- `webhook_events` — raw event id + type + payload + processed_at. **Idempotency depends on this:**
  Stripe retries, and without a processed-event ledger a retried `invoice.paid` double-writes.
- Extend `profiles` (or add `subscriptions`) with `stripe_subscription_id`, `current_period_end`,
  `cancel_at_period_end`.
- Keep `invoices` as the customer-facing record; populate it **from webhooks**, never from the client.

### 3. Edge functions
- `create-checkout-session` — authenticated; creates/reuses the Stripe customer, returns a
  checkout URL for the Pro price.
- `create-billing-portal-session` — lets an existing subscriber manage or cancel.
- `stripe-webhook` — the critical one. Must verify the signature with `STRIPE_WEBHOOK_SECRET`,
  and must be the **only** writer of subscription state. Handle at minimum:
  `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`,
  `invoice.paid`, `invoice.payment_failed`.

### 4. Frontend
- Pricing/upgrade page with a Pro CTA → checkout session.
- Post-checkout return route.
- Gate Pro-only features on `subscription_plan`, read server-side.
- Extend the existing Invoices page with paid/failed status and a Stripe-hosted receipt link.

### 5. Invoicing (B5)
- Invoice rows are created by the `invoice.paid` / `invoice.payment_failed` webhooks.
- `invoice_number` needs a generator; the column exists but nothing writes it.
- Email the invoice through Resend on `invoice.paid` — the sender domain is already verified.
- `stripe_invoice_id` is the idempotency key: upsert on it so a retried webhook cannot duplicate.

### 6. Verification
- Stripe **test mode** end to end with test cards, including a declined card.
- `stripe listen` / CLI-triggered webhooks to prove signature verification and idempotency.
- Confirm RLS: user A must not read user B's invoices.
- Only then switch to live keys.

---

## Risks

1. **The SOW word is "validate", the work is "build".** Steps 2–6 are a multi-day integration.
   Task 2B is scheduled Sept 30 – Oct 4 alongside four other goals. This should be raised with
   Sylvia before 2B starts, not after.
2. **Step 1 is entirely client-side and blocks everything.** No Stripe account means no keys,
   no price ids, no test mode. This is the long pole.
3. **`.env` is committed to this repo** across 20 commits (`.gitignore` lists it twice, but
   gitignore does not apply to already-tracked files). A `STRIPE_SECRET_KEY` placed in `.env`
   would be published to GitHub on the next commit. **Stripe keys must go in Supabase edge
   function secrets only.** The tracked `.env` was untracked locally during this milestone, but
   it still exists in history.
4. **Webhook idempotency is the classic failure.** Without `webhook_events`, Stripe's retries
   double-charge the customer record or duplicate invoices. Cheap to design in now, painful later.
5. **Two missing PDFs** — the Pro Plan Readiness Checklist (B1) and Merge Plan (B2) — may add
   requirements this scope does not anticipate.

## Recommendation

Split Task 2B. Ship **B3 (marketing states)** and the **invoicing groundwork** that needs no
Stripe account, and treat the Stripe integration as its own scoped piece starting when the
account and keys land. The dependency chain — account → keys → test mode → live — cannot be
compressed by working harder at this end.

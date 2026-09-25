# Recovered edge function sources

These three functions are **deployed and ACTIVE** on the Supabase project but were never
committed to this repository. They were recovered on 2026-09-25 by downloading the deployed
ESZIP bundles from the Management API and extracting the entry module, so the repo is no
longer missing production code.

| Function | Deployed version | Notes |
|---|---|---|
| `stripe-webhook` | v4 | Handles `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted` |
| `stripe-checkout` | v4 | Creates a Checkout session |
| `send-invoice` | v4 | Emails an invoice via the shared `sendEmail()` helper |

They are parked here rather than in their deployed slots because **redeploying them from this
extracted form is not safe**: the extraction recovers the entry module, not the exact original
file, and `supabase functions deploy` would overwrite a working deployment with it.

Treat these as a **reference copy for review**, not as deploy sources.

## Two defects found in the deployed `stripe-webhook`

### 1. The signature check can be skipped

```ts
if (webhookSecret && signature) {
  event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
} else {
  const body = await req.json();
  event = body;            // unverified input, trusted
}
```

`STRIPE_WEBHOOK_SECRET` is currently **not set** on this project, so the `else` branch is the
live path. Anyone who knows the function URL can POST a handcrafted
`checkout.session.completed` naming any `userId` and grant themselves a paid plan, plus insert
an arbitrary `invoices` row. The function is `verify_jwt = false`, so no Supabase auth stands
in the way either.

This is only unexploited today because `STRIPE_SECRET_KEY` is also unset, which makes the
function return 500 before it reaches the branch. **Setting the Stripe key without also
setting the webhook secret would open the hole.**

### 2. No idempotency guard

Stripe retries on any non-2xx and can redeliver on success. The handler does a bare
`invoices.insert(...)` keyed on `stripe_invoice_id = session.id`, with no check for an existing
row. A redelivered `checkout.session.completed` inserts a second invoice for the same payment
and re-extends the subscription by another month.

Migration `20260925195000` adds the unique index on `invoices.stripe_invoice_id`, which turns
that silent duplicate into a visible constraint error — a smaller problem, but still an error.

## Relationship to the new scaffolding

`create-checkout-session`, `create-billing-portal-session` and the repo's `stripe-webhook`
were written before these deployments were discovered. They address both defects: the
signature is verified unconditionally, and `stripe_webhook_events` gives claim-first
idempotency.

**Decision needed** — see `docs/task2-requirements/STRIPE_TEST_MODE_RUNBOOK.md`:
whether to replace the deployed trio with the new functions, or port the two fixes into the
existing ones. Either is defensible; overwriting live functions is not a call to make silently.

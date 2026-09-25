/**
 * Stripe webhook: the only writer of billing state.
 *
 * Two rules this file exists to enforce:
 *
 *  1. Nothing is trusted without a valid signature. The raw body is verified against
 *     STRIPE_WEBHOOK_SECRET before a single field is read. Without this, anyone who learns
 *     the URL can POST themselves a Pro subscription.
 *
 *  2. Every delivery is idempotent. Stripe retries on any non-2xx and can deliver the same
 *     event more than once even on success. The event id is inserted into
 *     stripe_webhook_events FIRST; a duplicate collides on the primary key and we return 200
 *     without reprocessing. Without this, a retried invoice.paid bills the customer record
 *     twice and re-grants a subscription period.
 *
 * verify_jwt must be false for this function (see config.toml): Stripe calls it without a
 * Supabase JWT. The signature check is the authentication.
 */
import {
  corsHeaders,
  getServiceClient,
  getStripe,
  jsonResponse,
  requireEnv,
  PRO_PLAN,
  STARTER_PLAN,
  StripeConfigError,
} from "../_shared/stripe.ts";

/** Stripe sends amounts in the currency's smallest unit. */
const fromMinorUnits = (amount: number | null | undefined) =>
  amount == null ? null : amount / 100;

const toIso = (seconds: number | null | undefined) =>
  seconds == null ? null : new Date(seconds * 1000).toISOString();

/**
 * Resolves the IEP user for a Stripe customer.
 * The stripe_customers mapping is authoritative; subscription metadata is only a fallback
 * for customers created outside this app (e.g. manually in the dashboard).
 */
async function resolveUserId(
  admin: ReturnType<typeof getServiceClient>,
  customerId: string | null | undefined,
  metadataUserId?: string | null,
): Promise<string | null> {
  if (customerId) {
    const { data } = await admin
      .from("stripe_customers")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (data?.user_id) return data.user_id;
  }
  return metadataUserId ?? null;
}

async function applySubscriptionState(
  admin: ReturnType<typeof getServiceClient>,
  userId: string,
  sub: {
    id: string;
    status: string;
    current_period_end?: number | null;
    cancel_at_period_end?: boolean | null;
  },
) {
  // Stripe treats trialing as entitled; past_due keeps access until Stripe gives up and
  // cancels, which is the behaviour customers expect while they fix a card.
  const entitled = sub.status === "active" || sub.status === "trialing" || sub.status === "past_due";

  const { error } = await admin
    .from("profiles")
    .update({
      subscription_plan: entitled ? PRO_PLAN : STARTER_PLAN,
      subscription_status: sub.status,
      stripe_subscription_id: sub.id,
      current_period_end: toIso(sub.current_period_end),
      cancel_at_period_end: Boolean(sub.cancel_at_period_end),
      subscription_expires_at: toIso(sub.current_period_end),
    })
    .eq("user_id", userId);

  if (error) throw error;
}

async function handleEvent(
  admin: ReturnType<typeof getServiceClient>,
  stripe: ReturnType<typeof getStripe>,
  event: { id: string; type: string; data: { object: Record<string, unknown> } },
) {
  const object = event.data.object as Record<string, never> & Record<string, unknown>;

  switch (event.type) {
    case "checkout.session.completed": {
      const subscriptionId = object.subscription as string | null;
      const customerId = object.customer as string | null;
      const metaUser = (object.metadata as Record<string, string> | null)?.supabase_user_id;
      const userId = await resolveUserId(admin, customerId, metaUser);
      if (!userId || !subscriptionId) break;

      // The session carries no period fields, so read the subscription itself.
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      await applySubscriptionState(admin, userId, {
        id: sub.id,
        status: sub.status,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
      });
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const customerId = object.customer as string | null;
      const metaUser = (object.metadata as Record<string, string> | null)?.supabase_user_id;
      const userId = await resolveUserId(admin, customerId, metaUser);
      if (!userId) break;

      await applySubscriptionState(admin, userId, {
        id: object.id as string,
        status: object.status as string,
        current_period_end: object.current_period_end as number | null,
        cancel_at_period_end: object.cancel_at_period_end as boolean | null,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const customerId = object.customer as string | null;
      const metaUser = (object.metadata as Record<string, string> | null)?.supabase_user_id;
      const userId = await resolveUserId(admin, customerId, metaUser);
      if (!userId) break;

      const { error } = await admin
        .from("profiles")
        .update({
          subscription_plan: STARTER_PLAN,
          subscription_status: "canceled",
          stripe_subscription_id: null,
          cancel_at_period_end: false,
        })
        .eq("user_id", userId);
      if (error) throw error;
      break;
    }

    case "invoice.paid":
    case "invoice.payment_failed": {
      const customerId = object.customer as string | null;
      const userId = await resolveUserId(admin, customerId, null);
      if (!userId) break;

      const stripeInvoiceId = object.id as string;
      const paid = event.type === "invoice.paid";

      // Upsert on stripe_invoice_id (unique index) so a redelivered event updates the row
      // it already created instead of inserting a duplicate charge record.
      const { data: existing } = await admin
        .from("invoices")
        .select("id, invoice_number")
        .eq("stripe_invoice_id", stripeInvoiceId)
        .maybeSingle();

      let invoiceNumber = existing?.invoice_number ?? null;
      if (!invoiceNumber) {
        const { data: generated } = await admin.rpc("next_invoice_number");
        invoiceNumber = (generated as string | null) ?? null;
      }

      const lines = object.lines as { data?: { description?: string }[] } | undefined;

      const { error } = await admin.from("invoices").upsert(
        {
          user_id: userId,
          stripe_invoice_id: stripeInvoiceId,
          invoice_number: invoiceNumber,
          plan_name: PRO_PLAN,
          amount: fromMinorUnits(object.amount_due as number | null),
          currency: ((object.currency as string | null) ?? "usd").toUpperCase(),
          status: paid ? "paid" : "payment_failed",
          paid_at: paid ? toIso(object.status_transitions
            ? (object.status_transitions as { paid_at?: number }).paid_at
            : null) ?? new Date().toISOString() : null,
          description: lines?.data?.[0]?.description ?? "IEP Pro subscription",
          billing_period_start: toIso(object.period_start as number | null),
          billing_period_end: toIso(object.period_end as number | null),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stripe_invoice_id" },
      );
      if (error) throw error;
      break;
    }

    default:
      // Unhandled types are still recorded in the ledger and acknowledged, so Stripe stops
      // retrying them. Add a case here when a new event type becomes relevant.
      break;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  type StripeEvent = {
    id: string;
    type: string;
    livemode: boolean;
    data: { object: Record<string, unknown> };
  };
  let admin: ReturnType<typeof getServiceClient> | null = null;
  let event: StripeEvent | null = null;

  try {
    const stripe = getStripe();
    const webhookSecret = requireEnv("STRIPE_WEBHOOK_SECRET");
    const signature = req.headers.get("stripe-signature");
    if (!signature) return jsonResponse({ error: "Missing stripe-signature" }, 400);

    // Must be the raw body: any reserialization changes the bytes and breaks the signature.
    const rawBody = await req.text();

    event = (await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
    )) as unknown as StripeEvent;

    admin = getServiceClient();

    // Claim the event before doing any work. A duplicate delivery loses this race and is
    // acknowledged without reprocessing.
    const { error: claimError } = await admin.from("stripe_webhook_events").insert({
      id: event.id,
      type: event.type,
      livemode: event.livemode,
      payload: event as unknown as Record<string, unknown>,
    });

    if (claimError) {
      // 23505 = unique_violation: already seen. Acknowledge so Stripe stops retrying.
      if ((claimError as { code?: string }).code === "23505") {
        return jsonResponse({ received: true, duplicate: true });
      }
      throw claimError;
    }

    await handleEvent(admin, stripe, event);

    await admin
      .from("stripe_webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", event.id);

    return jsonResponse({ received: true });
  } catch (error) {
    if (error instanceof StripeConfigError) {
      console.error("[stripe-webhook] config:", error.message);
      return jsonResponse({ error: error.message, code: "stripe_not_configured" }, 503);
    }

    const message = error instanceof Error ? error.message : String(error);
    console.error("[stripe-webhook]", message);

    // Release the claim so Stripe's retry is processed rather than dismissed as a duplicate.
    // The row is deleted, not just annotated: while it exists, the claim insert above
    // collides and the retry returns 200 without ever running the handler. The failure is
    // logged above, and the retry re-inserts the row with a fresh received_at.
    //
    // `.is("processed_at", null)` is the guard: if the handler actually succeeded and the
    // failure came from the processed_at update itself, the row is already marked done and
    // must survive, because reprocessing it would double-apply the event.
    try {
      if (admin && event?.id) {
        await admin
          .from("stripe_webhook_events")
          .delete()
          .eq("id", event.id)
          .is("processed_at", null);
      }
    } catch (cleanupError) {
      console.error("[stripe-webhook] claim release failed:", cleanupError);
    }

    return jsonResponse({ error: message }, 500);
  }
});

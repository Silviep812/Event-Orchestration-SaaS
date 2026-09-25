/**
 * Stripe webhook — the only writer of billing state.
 *
 * This is the deployed v4 function with two defects fixed. Its behaviour, event handling and
 * receipt email are otherwise unchanged, so porting cannot regress what already worked.
 *
 * Fix 1 — the signature check was conditional:
 *
 *     if (webhookSecret && signature) { constructEvent(...) }
 *     else { event = await req.json() }   // unverified input, trusted
 *
 *   This function runs with verify_jwt = false, so with STRIPE_WEBHOOK_SECRET unset the
 *   else-branch was the live path: anyone who knew the URL could POST a handcrafted
 *   checkout.session.completed naming any userId and grant themselves a paid plan. The
 *   signature is now verified unconditionally and a missing secret is a hard 503, never a
 *   bypass.
 *
 * Fix 2 — there was no idempotency guard. Stripe retries on any non-2xx and can redeliver
 *   on success; a bare invoices.insert meant a redelivered event created a second invoice
 *   for the same payment and pushed subscription_expires_at another month out. The event id
 *   is now claimed in stripe_webhook_events BEFORE any work, so a duplicate collides on the
 *   primary key and is acknowledged without reprocessing.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.6.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { sendEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url!, key!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let supabase: ReturnType<typeof serviceClient> | null = null;
  let eventId: string | null = null;

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey) {
      return jsonResponse({ error: "Stripe not configured" }, 503);
    }

    // Fix 1: no secret means no way to authenticate the caller. Refuse rather than fall
    // back to trusting the body — this function has no other authentication.
    if (!webhookSecret) {
      console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set; refusing unverified events");
      return jsonResponse(
        { error: "Webhook secret not configured", code: "webhook_secret_missing" },
        503,
      );
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return jsonResponse({ error: "Missing stripe-signature" }, 400);
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-02-24.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Must be the raw body: reserializing changes the bytes and breaks verification.
    const rawBody = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
    } catch (verifyError) {
      const msg = verifyError instanceof Error ? verifyError.message : "Invalid signature";
      console.error("[stripe-webhook] signature verification failed:", msg);
      return jsonResponse({ error: "Invalid signature" }, 400);
    }

    eventId = event.id;
    supabase = serviceClient();

    // Fix 2: claim the event before doing any work. A redelivery loses this race.
    const { error: claimError } = await supabase.from("stripe_webhook_events").insert({
      id: event.id,
      type: event.type,
      livemode: event.livemode,
      payload: event as unknown as Record<string, unknown>,
    });

    if (claimError) {
      // 23505 = unique_violation: already processed. Acknowledge so Stripe stops retrying.
      if ((claimError as { code?: string }).code === "23505") {
        return jsonResponse({ received: true, duplicate: true }, 200);
      }
      throw claimError;
    }

    // ---- Handlers below are the deployed v4 logic, unchanged apart from the guards noted.

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session & Record<string, unknown>;
      const userId = (session.metadata?.userId as string | undefined) || session.client_reference_id;
      const customerEmail = session.customer_details?.email || (session as { customer_email?: string }).customer_email;
      const planName = (session.metadata?.plan_name as string | undefined) || "pro";

      if (userId) {
        const subscriptionStart = new Date().toISOString();
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await supabase.from("profiles").update({
          subscription_plan: planName,
          subscription_status: "active",
          subscription_started_at: subscriptionStart,
          subscription_expires_at: expiresAt.toISOString(),
        }).eq("user_id", userId);

        const amount = session.amount_total ? session.amount_total / 100 : 0;
        const currency = session.currency?.toUpperCase() || "USD";

        // invoice_number now comes from the shared sequence (IEP-000001) rather than
        // `INV-${Date.now()}`, which was only unique by luck of timing.
        const { data: generatedNumber } = await supabase.rpc("next_invoice_number");
        const invoiceNumber = (generatedNumber as string | null) ?? `INV-${Date.now()}`;

        // Upsert on stripe_invoice_id (unique index) instead of a bare insert, so even if a
        // duplicate slips past the ledger it updates the existing row rather than adding a
        // second invoice for the same payment.
        const { data: invoice } = await supabase.from("invoices").upsert(
          {
            user_id: userId,
            plan_name: planName,
            amount,
            currency,
            status: "paid",
            paid_at: subscriptionStart,
            invoice_number: invoiceNumber,
            description: `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan Subscription`,
            billing_period_start: subscriptionStart.slice(0, 10),
            billing_period_end: expiresAt.toISOString().slice(0, 10),
            stripe_invoice_id: session.id,
          },
          { onConflict: "stripe_invoice_id" },
        ).select("id, invoice_number").single();

        if (customerEmail && invoice) {
          const dateStr = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #1a1a1a; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 20px;">Payment Receipt</h1>
              </div>
              <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                <p style="color: #444;">Thank you for your payment. Your ${escapeHtml(planName)} plan is now active.</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                  <tr><td style="padding: 8px; color: #666;">Invoice #</td><td style="padding: 8px; font-weight: 600; text-align: right;">${escapeHtml(invoice.invoice_number || invoice.id.slice(0, 8))}</td></tr>
                  <tr style="background: #f8fafc;"><td style="padding: 8px; color: #666;">Plan</td><td style="padding: 8px; font-weight: 600; text-align: right; text-transform: capitalize;">${escapeHtml(planName)}</td></tr>
                  <tr><td style="padding: 8px; color: #666;">Amount</td><td style="padding: 8px; font-weight: 600; text-align: right;">$${amount.toFixed(2)} ${escapeHtml(currency)}</td></tr>
                  <tr style="background: #f8fafc;"><td style="padding: 8px; color: #666;">Status</td><td style="padding: 8px; font-weight: 600; text-align: right; color: #16a34a;">Paid</td></tr>
                  <tr><td style="padding: 8px; color: #666;">Date</td><td style="padding: 8px; font-weight: 600; text-align: right;">${escapeHtml(dateStr)}</td></tr>
                </table>
                <p style="color: #888; font-size: 12px; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                  IEP Event Planning Platform
                </p>
              </div>
            </div>`;

          await sendEmail({
            to: [customerEmail],
            subject: `Receipt — ${invoice.invoice_number || "Invoice"} for ${escapeHtml(planName)} Plan`,
            template: "stripe_receipt",
            userId,
            html,
            metadata: {
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoice_number,
              stripeSessionId: session.id,
            },
          });
        }
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice & Record<string, unknown>;
      const subscriptionId = invoice.subscription as string | null;
      if (subscriptionId && invoice.customer_email) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const customer = await stripe.customers.retrieve(invoice.customer as string);
        const userId = (sub.metadata?.userId as string | undefined) ||
          ((customer as Stripe.Customer).metadata?.userId as string | undefined);
        if (userId) {
          const periodEnd = new Date((sub.current_period_end || 0) * 1000).toISOString();
          await supabase.from("profiles").update({
            subscription_expires_at: periodEnd,
          }).eq("user_id", userId);
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription & Record<string, unknown>;
      const userId = sub.metadata?.userId as string | undefined;
      if (userId) {
        await supabase.from("profiles").update({
          subscription_status: "cancelled",
          subscription_plan: "starter",
        }).eq("user_id", userId);
      }
    }

    await supabase
      .from("stripe_webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", event.id);

    return jsonResponse({ received: true }, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[stripe-webhook]", msg);

    // Release the claim so Stripe's retry is actually processed rather than dismissed as a
    // duplicate. Guarded on processed_at IS NULL: if the handler succeeded and only the
    // bookkeeping update failed, the row is already marked done and must survive, because
    // reprocessing would double-apply the event.
    //
    // The row is deleted rather than annotated — while it exists the retry's claim insert
    // collides and returns 200 without running the handler. The failure is in the log line
    // above; the retry re-inserts the row with a fresh received_at.
    try {
      if (supabase && eventId) {
        await supabase
          .from("stripe_webhook_events")
          .delete()
          .eq("id", eventId)
          .is("processed_at", null);
      }
    } catch (cleanupError) {
      console.error("[stripe-webhook] claim release failed:", cleanupError);
    }

    return jsonResponse({ error: msg }, 500);
  }
});

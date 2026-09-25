/**
 * Opens the Stripe-hosted billing portal so a subscriber can update their card, download
 * receipts, or cancel.
 *
 * Cancellation flows back through customer.subscription.updated / .deleted, so the portal
 * needs no bespoke cancel endpoint here.
 */
import {
  appUrl,
  corsHeaders,
  getCallerUser,
  getServiceClient,
  getStripe,
  jsonResponse,
  StripeConfigError,
} from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const user = await getCallerUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const admin = getServiceClient();
    const { data: mapping } = await admin
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    // No Stripe customer means they have never checked out; there is nothing to manage.
    if (!mapping?.stripe_customer_id) {
      return jsonResponse({ error: "No billing account", code: "no_customer" }, 404);
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: mapping.stripe_customer_id,
      return_url: `${appUrl()}/dashboard/invoices`,
    });

    return jsonResponse({ url: session.url });
  } catch (error) {
    if (error instanceof StripeConfigError) {
      console.error("[create-billing-portal-session] config:", error.message);
      return jsonResponse({ error: error.message, code: "stripe_not_configured" }, 503);
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error("[create-billing-portal-session]", message);
    return jsonResponse({ error: message }, 400);
  }
});

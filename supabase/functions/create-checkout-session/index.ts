/**
 * Starts a Stripe Checkout session for the Pro plan.
 *
 * The caller's identity comes from their Authorization header, never from the request body:
 * a client that could name its own user_id could buy a subscription for someone else, or
 * more usefully to an attacker, attach someone else's payment to their own account.
 *
 * The price comes from STRIPE_PRICE_PRO, not the request, so a client cannot substitute a
 * cheaper price id.
 */
import {
  appUrl,
  corsHeaders,
  getCallerUser,
  getOrCreateStripeCustomer,
  getServiceClient,
  getStripe,
  jsonResponse,
  requireEnv,
  StripeConfigError,
} from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const user = await getCallerUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const stripe = getStripe();
    const priceId = requireEnv("STRIPE_PRICE_PRO");
    const admin = getServiceClient();

    // Already subscribed: send them to the billing portal instead of selling a second
    // subscription. Stripe would happily create one and bill twice.
    const { data: profile } = await admin
      .from("profiles")
      .select("subscription_plan, subscription_status, stripe_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.stripe_subscription_id && profile.subscription_status === "active") {
      return jsonResponse(
        { error: "Already subscribed", code: "already_subscribed" },
        409,
      );
    }

    const customerId = await getOrCreateStripeCustomer(stripe, user.id, user.email);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl()}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl()}/dashboard?checkout=cancelled`,
      allow_promotion_codes: true,
      // Echoed back on the webhook event. The webhook still verifies the customer mapping
      // rather than trusting this, but it makes support triage far easier.
      subscription_data: { metadata: { supabase_user_id: user.id } },
      metadata: { supabase_user_id: user.id },
    });

    return jsonResponse({ url: session.url, sessionId: session.id });
  } catch (error) {
    if (error instanceof StripeConfigError) {
      console.error("[create-checkout-session] config:", error.message);
      return jsonResponse({ error: error.message, code: "stripe_not_configured" }, 503);
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error("[create-checkout-session]", message);
    return jsonResponse({ error: message }, 400);
  }
});

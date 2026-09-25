/**
 * Creates a Stripe Checkout session.
 *
 * This is the deployed v4 function with one defect fixed. The identity handling, response
 * shape and metadata keys (`userId`, `plan_name`, `client_reference_id`) are unchanged, so
 * the webhook keeps resolving users exactly as it does today.
 *
 * Fix — `priceId` was taken from the request body:
 *
 *     const { priceId, planName, successUrl, cancelUrl } = await req.json();
 *     ... line_items: [{ price: priceId, quantity: 1 }]
 *
 *   A client could name any price id, including a $0 or $1 price from this account, and get
 *   a real subscription for it. `planName` had the same problem: it is written straight to
 *   `profiles.subscription_plan` by the webhook, so a caller could ask for "pro" while
 *   checking out on a cheaper price.
 *
 *   The price now comes from STRIPE_PRICE_PRO and the plan name is fixed to "pro". Only the
 *   return URLs are still caller-supplied, and they are restricted to same-origin paths so
 *   the session cannot be used to bounce a user to an unrelated site after payment.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import Stripe from "https://esm.sh/stripe@17.6.0?target=deno";

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

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

/**
 * Accepts only a same-origin path, so a caller cannot redirect the user somewhere else
 * after checkout. Anything absolute or malformed falls back to the default.
 */
function safeReturnUrl(candidate: unknown, origin: string, fallbackPath: string): string {
  const base = origin || "http://localhost:8080";
  if (typeof candidate === "string" && candidate.startsWith("/")) {
    return `${base}${candidate}`;
  }
  return `${base}${fallbackPath}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return jsonResponse({ error: "Stripe not configured" }, 503);
    }

    const priceId = Deno.env.get("STRIPE_PRICE_PRO");
    if (!priceId) {
      console.error("[stripe-checkout] STRIPE_PRICE_PRO is not set");
      return jsonResponse(
        { error: "Stripe price not configured", code: "price_not_configured" },
        503,
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-02-24.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = serviceClient();
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user?.email) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Already subscribed: creating a second session would bill them twice.
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_plan, subscription_status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.subscription_plan === "pro" && profile.subscription_status === "active") {
      return jsonResponse({ error: "Already subscribed", code: "already_subscribed" }, 409);
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const origin = req.headers.get("origin") || "";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      success_url: safeReturnUrl(body.successUrl, origin, "/dashboard/invoices"),
      cancel_url: safeReturnUrl(body.cancelUrl, origin, "/#pricing"),
      // Keys match what the webhook reads. Do not rename without updating it.
      metadata: {
        userId: user.id,
        plan_name: "pro",
      },
    });

    return jsonResponse({ url: session.url, sessionId: session.id }, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[stripe-checkout]", msg);
    return jsonResponse({ error: msg }, 500);
  }
});

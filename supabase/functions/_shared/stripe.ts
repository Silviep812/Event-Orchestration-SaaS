/**
 * Shared Stripe wiring for the billing edge functions.
 *
 * Config lives in Supabase edge function secrets, never in `.env` — that file is tracked in
 * this repository's git history, so a key placed there would be published on the next commit.
 *
 * Required secrets:
 *   STRIPE_SECRET_KEY      sk_test_… while testing, sk_live_… in production
 *   STRIPE_WEBHOOK_SECRET  whsec_…   from `stripe listen` or the dashboard endpoint
 *   STRIPE_PRICE_PRO       price_…   the Pro monthly price
 *
 * Optional:
 *   APP_URL                base URL for checkout return links (defaults to the live site)
 */
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Starter is free and has no Stripe object; only Pro is purchasable today. */
export const PRO_PLAN = "pro";
export const STARTER_PLAN = "starter";

export class StripeConfigError extends Error {}

export function requireEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new StripeConfigError(
      `${name} is not configured. Add it to the Supabase edge function secrets ` +
        `(Project Settings > Edge Functions > Secrets), not to .env.`,
    );
  }
  return value;
}

export function getStripe(): Stripe {
  return new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
    apiVersion: "2024-06-20",
    // Deno has no native Node http client; Stripe ships a fetch-based one for edge runtimes.
    httpClient: Stripe.createFetchHttpClient(),
  });
}

/** Service-role client. Only a Stripe-signed webhook may change billing state. */
export function getServiceClient() {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export function appUrl(): string {
  return (Deno.env.get("APP_URL")?.trim() || "https://idaeventpartners.com").replace(/\/$/, "");
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Resolves the caller from their Authorization header.
 * Returns null rather than throwing so callers can shape their own 401.
 */
export async function getCallerUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const admin = getServiceClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

/**
 * Returns this user's Stripe customer id, creating the customer on first use.
 *
 * Concurrent calls (a double-clicked upgrade button) would otherwise create two Stripe
 * customers for one user, so the insert is an upsert on the primary key and the stored row
 * wins. The orphaned Stripe customer is harmless and carries no subscription.
 */
export async function getOrCreateStripeCustomer(
  stripe: Stripe,
  userId: string,
  email?: string | null,
): Promise<string> {
  const admin = getServiceClient();

  const { data: existing } = await admin
    .from("stripe_customers")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: { supabase_user_id: userId },
  });

  const { error } = await admin.from("stripe_customers").upsert(
    {
      user_id: userId,
      stripe_customer_id: customer.id,
      email: email ?? null,
      livemode: customer.livemode,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;

  // Re-read: if a concurrent call won the upsert, its customer id is the canonical one.
  const { data: settled } = await admin
    .from("stripe_customers")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  return settled?.stripe_customer_id ?? customer.id;
}

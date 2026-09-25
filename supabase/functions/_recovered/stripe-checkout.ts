import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import Stripe from "https://esm.sh/stripe@17.6.0?target=deno";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: "Unauthorized"
      }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(JSON.stringify({
        error: "Stripe not configured"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-02-24.acacia",
      httpClient: Stripe.createFetchHttpClient()
    });
    const supabase = serviceClient();
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user?.email) {
      return new Response(JSON.stringify({
        error: "Unauthorized"
      }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    const { priceId, planName, successUrl, cancelUrl } = await req.json();
    if (!priceId) {
      return new Response(JSON.stringify({
        error: "priceId is required"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: [
        "card"
      ],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      customer_email: user.email,
      client_reference_id: user.id,
      success_url: successUrl || `${req.headers.get("origin") || "http://localhost:8080"}/dashboard/invoices`,
      cancel_url: cancelUrl || `${req.headers.get("origin") || "http://localhost:8080"}/#pricing`,
      metadata: {
        userId: user.id,
        plan_name: planName || "pro"
      }
    });
    return new Response(JSON.stringify({
      url: session.url,
      sessionId: session.id
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({
      error: msg
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});

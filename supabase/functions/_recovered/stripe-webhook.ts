import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.6.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { sendEmail } from "../_shared/email.ts";
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
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
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
    const signature = req.headers.get("stripe-signature");
    let event;
    if (webhookSecret && signature) {
      const body = await req.text();
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      const body = await req.json();
      event = body;
    }
    const supabase = serviceClient();
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId || session.client_reference_id;
      const customerEmail = session.customer_details?.email || session.customer_email;
      const planName = session.metadata?.plan_name || "pro";
      if (userId) {
        const subscriptionStart = new Date().toISOString();
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        await supabase.from("profiles").update({
          subscription_plan: planName,
          subscription_status: "active",
          subscription_started_at: subscriptionStart,
          subscription_expires_at: expiresAt.toISOString()
        }).eq("user_id", userId);
        const invoiceNumber = `INV-${Date.now()}`;
        const amount = session.amount_total ? session.amount_total / 100 : 0;
        const currency = session.currency?.toUpperCase() || "USD";
        const { data: invoice } = await supabase.from("invoices").insert({
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
          stripe_invoice_id: session.id
        }).select("id, invoice_number").single();
        if (customerEmail && invoice) {
          const dateStr = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
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
          const input = {
            to: [
              customerEmail
            ],
            subject: `Receipt — ${invoice.invoice_number || "Invoice"} for ${escapeHtml(planName)} Plan`,
            template: "stripe_receipt",
            userId,
            html,
            metadata: {
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoice_number,
              stripeSessionId: session.id
            }
          };
          await sendEmail(input);
        }
      }
    }
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      if (subscriptionId && invoice.customer_email) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = sub.metadata?.userId || (await stripe.customers.retrieve(invoice.customer)).metadata?.userId;
        if (userId) {
          const periodEnd = new Date((sub.current_period_end || 0) * 1000).toISOString();
          await supabase.from("profiles").update({
            subscription_expires_at: periodEnd
          }).eq("user_id", userId);
        }
      }
    }
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      const userId = sub.metadata?.userId;
      if (userId) {
        await supabase.from("profiles").update({
          subscription_status: "cancelled",
          subscription_plan: "starter"
        }).eq("user_id", userId);
      }
    }
    return new Response(JSON.stringify({
      received: true
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

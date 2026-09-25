import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const supabase = serviceClient();
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user?.email) {
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
    const callerEmail = userData.user.email.toLowerCase();
    const callerId = userData.user.id;
    const body = await req.json();
    const { invoiceId } = body;
    if (!invoiceId) {
      return new Response(JSON.stringify({
        error: "invoiceId is required"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    const { data: invoice, error: invErr } = await supabase.from("invoices").select("*").eq("id", invoiceId).single();
    if (invErr || !invoice) {
      return new Response(JSON.stringify({
        error: "Invoice not found"
      }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    if (invoice.user_id !== callerId) {
      return new Response(JSON.stringify({
        error: "Forbidden"
      }), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    const inv = invoice;
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a1a; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">Payment Receipt</h1>
        </div>
        <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="color: #444;">Thank you for your payment.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr>
              <td style="padding: 8px; color: #666; font-size: 13px;">Invoice #</td>
              <td style="padding: 8px; font-weight: 600; text-align: right; font-size: 13px;">${inv.invoice_number || invoiceId.slice(0, 8)}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 8px; color: #666; font-size: 13px;">Plan</td>
              <td style="padding: 8px; font-weight: 600; text-align: right; font-size: 13px; text-transform: capitalize;">${inv.plan_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #666; font-size: 13px;">Amount</td>
              <td style="padding: 8px; font-weight: 600; text-align: right; font-size: 13px;">$${Number(inv.amount).toFixed(2)} ${inv.currency}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 8px; color: #666; font-size: 13px;">Status</td>
              <td style="padding: 8px; font-weight: 600; text-align: right; font-size: 13px; text-transform: capitalize; color: #16a34a;">${inv.status}</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #666; font-size: 13px;">Date</td>
              <td style="padding: 8px; font-weight: 600; text-align: right; font-size: 13px;">${dateStr}</td>
            </tr>
            ${inv.billing_period_start ? `
            <tr style="background: #f8fafc;">
              <td style="padding: 8px; color: #666; font-size: 13px;">Billing Period</td>
              <td style="padding: 8px; font-weight: 600; text-align: right; font-size: 13px;">${inv.billing_period_start} – ${inv.billing_period_end || "ongoing"}</td>
            </tr>` : ""}
          </table>
          ${inv.description ? `<p style="color: #666; font-size: 13px; margin-top: 16px;">${inv.description}</p>` : ""}
          <p style="color: #888; font-size: 12px; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            IEP Event Planning Platform · ${dateStr}
          </p>
        </div>
      </div>`;
    const input = {
      to: [
        callerEmail
      ],
      subject: `Receipt — ${inv.invoice_number || "Invoice"} for ${inv.plan_name}`,
      template: "invoice_receipt",
      userId: callerId,
      html,
      metadata: {
        invoiceId,
        invoiceNumber: inv.invoice_number
      }
    };
    const r = await sendEmail(input);
    return new Response(JSON.stringify(r), {
      status: r.ok ? 200 : 500,
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

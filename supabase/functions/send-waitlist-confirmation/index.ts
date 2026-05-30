import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM = "Ida Event Partners <noreply@idaeventpartners.com>";
const SUBJECT = "You're on the list — Ida Event Partners";
const BODY_TEXT =
  "Thank you for your interest in Ida Event Partners. We'll notify you when we launch.";
const BODY_HTML = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;line-height:1.6;max-width:560px;margin:0 auto;padding:24px;">
    <h1 style="font-size:20px;margin:0 0 16px;">You're on the list 🎉</h1>
    <p style="margin:0 0 12px;">${BODY_TEXT}</p>
    <p style="margin:24px 0 0;font-size:12px;color:#666;">— The Ida Event Partners team</p>
  </div>
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Anti-relay: only send confirmations to addresses that just subscribed via the waitlist.
    // The client inserts into marketing_subscribers BEFORE invoking this function, so a matching
    // row must exist. This prevents using this endpoint as an arbitrary email relay.
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "Server not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const normalizedEmail = email.trim().toLowerCase();
    const { data: subscriber, error: lookupErr } = await admin
      .from("marketing_subscribers")
      .select("id, created_at")
      .ilike("email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lookupErr || !subscriber) {
      return new Response(
        JSON.stringify({ ok: false, error: "Email not on waitlist" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    // Only honor confirmations for very recently created subscribers (5 min window),
    // so attackers can't replay this endpoint repeatedly against historical addresses.
    const createdAt = subscriber.created_at ? new Date(subscriber.created_at as string).getTime() : 0;
    if (!createdAt || Date.now() - createdAt > 5 * 60 * 1000) {
      return new Response(
        JSON.stringify({ ok: true, skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("RESEND_API_KEY")?.trim();
    if (!apiKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [email.trim()],
      subject: SUBJECT,
      html: BODY_HTML,
      text: BODY_TEXT,
    });

    if (error) {
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, id: data?.id ?? null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

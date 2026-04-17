import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { sendEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const jwt = authHeader.replace(/^Bearer\s+/i, "");

  const admin = serviceClient();
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (roleErr || !isAdmin) {
    return new Response(JSON.stringify({ error: "Admin only" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  let body: { marketing_email_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const marketingEmailId = body.marketing_email_id?.trim();
  if (!marketingEmailId) {
    return new Response(JSON.stringify({ error: "marketing_email_id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const { data: emailRow, error: emailErr } = await admin
    .from("marketing_emails")
    .select("id, subject_line, email_name, template_key, marketing_campaigns ( campaign_name )")
    .eq("id", marketingEmailId)
    .maybeSingle();

  if (emailErr || !emailRow) {
    return new Response(JSON.stringify({ error: emailErr?.message ?? "Email template not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const subject =
    (emailRow.subject_line as string | null)?.trim() ||
    (emailRow.email_name as string | null)?.trim() ||
    "Update from IEP";

  const campaignName =
    (emailRow as { marketing_campaigns?: { campaign_name?: string | null } | null }).marketing_campaigns
      ?.campaign_name ?? "IEP";

  const templateKey = (emailRow.template_key as string | null)?.trim() || "marketing_campaign";

  const { data: subscribers, error: subErr } = await admin
    .from("marketing_subscribers")
    .select("id, email, name");

  if (subErr) {
    return new Response(JSON.stringify({ error: subErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const list = subscribers ?? [];
  if (list.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0, message: "No subscribers" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const sub of list) {
    const to = (sub.email as string).trim();
    if (!to || !to.includes("@")) continue;

    const firstName = (sub.name as string | null)?.trim() || "there";
    const html = `
      <div style="font-family:system-ui,Segoe UI,sans-serif;line-height:1.5;color:#111;max-width:560px">
        <p>Hi ${escapeHtml(firstName)},</p>
        <p>This is a message from <strong>${escapeHtml(campaignName)}</strong> on <strong>IEP — Interactive Event Planner</strong>.</p>
        <p><strong>${escapeHtml(subject)}</strong></p>
        <p style="color:#555;font-size:14px">Template: <code>${escapeHtml(templateKey)}</code></p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
        <p style="font-size:13px;color:#666">You received this because you subscribed for IEP updates. Prefer fewer emails? Reply and let us know.</p>
      </div>`;

    const result = await sendEmail(
      {
        to: [to],
        subject,
        html,
        template: `marketing:${templateKey}`,
        userId: userData.user.id,
        metadata: { marketing_email_id: marketingEmailId, subscriber_id: sub.id },
      },
      { logToDb: true },
    );

    if (!result.ok) {
      errors.push(`${to}: ${result.error ?? "send failed"}`);
      continue;
    }

    const { error: insErr } = await admin.from("marketing_email_deliveries").insert({
      subscriber_id: sub.id as string,
      email_id: marketingEmailId,
      sent_at: new Date().toISOString(),
      opened: false,
      clicked: false,
    });
    if (insErr) {
      errors.push(`${to}: logged send failed (${insErr.message})`);
      continue;
    }
    sent += 1;
  }

  return new Response(
    JSON.stringify({
      ok: true,
      sent,
      attempted: list.length,
      errors: errors.slice(0, 12),
    }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
});

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

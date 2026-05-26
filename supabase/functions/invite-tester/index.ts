import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { sendEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const FROM_ADDRESS = "Ida Event Partners <noreply@idaeventpartners.com>";

function emailHtml(actionLink: string): string {
  return `<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f5f5f7;margin:0;padding:32px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <tr><td style="padding:32px 32px 8px 32px;">
      <h1 style="margin:0 0 16px 0;font-size:22px;color:#111827;">You've been invited to test Ida Event Partners</h1>
      <p style="margin:0 0 24px 0;color:#374151;line-height:1.6;font-size:15px;">
        You have been invited to test the Ida Event Partners platform. Click below to set your password and get started.
      </p>
      <p style="margin:0 0 32px 0;">
        <a href="${actionLink}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">
          Set your password
        </a>
      </p>
      <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <span style="word-break:break-all;color:#374151;">${actionLink}</span>
      </p>
    </td></tr>
    <tr><td style="padding:24px 32px;border-top:1px solid #f1f1f4;color:#9ca3af;font-size:12px;">
      Ida Event Partners
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller and check admin role
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claimsData.claims.sub as string;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Admin check via has_role RPC (admin = manager in this project)
    const { data: isManager } = await admin.rpc("has_role", {
      _user_id: callerId, _role: "manager",
    });
    if (!isManager) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const emailRaw = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!emailRaw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      return new Response(JSON.stringify({ error: "Valid email required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = (Deno.env.get("SITE_URL") || req.headers.get("origin") || "").replace(/\/$/, "");
    const redirectTo = `${siteUrl || "https://iep-trial.lovable.app"}/auth?type=recovery`;

    // Find or create the user
    let userId: string | null = null;
    const { data: listData } = await admin.auth.admin.listUsers();
    const existing = listData?.users?.find(
      (u) => u.email?.toLowerCase() === emailRaw,
    );

    if (existing) {
      userId = existing.id;
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: emailRaw,
        email_confirm: true,
        user_metadata: { role: "tester", invited_as: "tester" },
      });
      if (createErr || !created?.user) {
        return new Response(JSON.stringify({ error: createErr?.message || "Failed to create user" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = created.user.id;
    }

    // Assign tester role
    const { error: roleErr } = await admin
      .from("user_roles")
      .upsert({ user_id: userId, role: "tester" }, { onConflict: "user_id,role" });
    if (roleErr) {
      return new Response(JSON.stringify({ error: roleErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate password recovery link (works for new and existing users)
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: emailRaw,
      options: { redirectTo },
    });
    if (linkErr || !linkData?.properties?.action_link) {
      return new Response(JSON.stringify({ error: linkErr?.message || "Failed to generate link" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const actionLink = linkData.properties.action_link;

    const send = await sendEmail({
      to: [emailRaw],
      from: FROM_ADDRESS,
      subject: "You've been invited to test Ida Event Partners",
      html: emailHtml(actionLink),
      template: "invite_tester",
      userId,
      metadata: { invited_by: callerId },
    });

    if (!send.ok) {
      return new Response(JSON.stringify({ error: send.error || "Email send failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, userId }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

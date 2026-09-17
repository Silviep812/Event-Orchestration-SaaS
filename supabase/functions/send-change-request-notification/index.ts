import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { sendEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function serviceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  let body: { changeRequestId?: string; status?: "approved" | "rejected" };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const changeRequestId = body.changeRequestId?.trim();
  const status = body.status;
  if (!changeRequestId || (status !== "approved" && status !== "rejected")) {
    return new Response(JSON.stringify({ error: "changeRequestId and a valid status are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const admin = serviceClient();
  const jwt = authHeader.slice("Bearer ".length);
  const { data: actorData, error: actorError } = await admin.auth.getUser(jwt);
  const actor = actorData.user;
  if (actorError || !actor) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const { data: request, error: requestError } = await admin
    .from("cm_change_requests")
    .select("id, event_id, requested_by, description, status")
    .eq("id", changeRequestId)
    .maybeSingle();
  if (requestError || !request) {
    return new Response(JSON.stringify({ error: requestError?.message ?? "Change request not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
  if (request.status !== status) {
    return new Response(JSON.stringify({ error: "Change request status does not match notification status" }), {
      status: 409,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
  if (!request.event_id || !request.requested_by) {
    return new Response(JSON.stringify({ error: "Change request is missing its event or requester" }), {
      status: 409,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const { data: event } = await admin.from("events").select("title, user_id").eq("id", request.event_id).maybeSingle();
  const { data: canCoordinate } = await admin.rpc("has_min_permission_level", {
    _user_id: actor.id,
    _level: "coordinator",
    _event_id: request.event_id,
  });
  const { data: isAdmin } = await admin.rpc("has_permission_level", {
    _user_id: actor.id,
    _level: "admin",
  });
  if (event?.user_id !== actor.id && !canCoordinate && !isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const { data: recipient, error: recipientError } = await admin.auth.admin.getUserById(request.requested_by);
  if (recipientError || !recipient.user?.email) {
    return new Response(JSON.stringify({ error: recipientError?.message ?? "Requester email unavailable" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const eventTitle = escapeHtml(event?.title?.trim() || "your event");
  const description = request.description?.trim() ? `<p>${escapeHtml(request.description.trim())}</p>` : "";
  const result = await sendEmail({
    to: [recipient.user.email],
    subject: `Change request ${status}: ${eventTitle}`,
    template: "change_request_status",
    eventId: request.event_id,
    userId: request.requested_by,
    metadata: { change_request_id: request.id, status, actor_id: actor.id },
    html: `<p>Your change request for <strong>${eventTitle}</strong> was <strong>${status}</strong>.</p>${description}`,
  });

  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 500,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});

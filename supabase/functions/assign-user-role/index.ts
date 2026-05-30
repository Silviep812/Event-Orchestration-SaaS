import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AssignRoleRequest {
  userId: string;
  role: string;
}

const ALLOWED_ROLES = new Set([
  "admin",
  "event_manager",
  "task_coordinator",
  "team_member",
  "viewer",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing Authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const actorId = userData.user.id;

    // Enforce admin-only role assignment to prevent privilege escalation
    const { data: isAdmin, error: adminErr } = await supabase.rpc(
      "policy_has_permission_level",
      { _user_id: actorId, _level: "admin" },
    );
    if (adminErr || !isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden: admin role required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const body = (await req.json()) as AssignRoleRequest;
    if (!body?.userId || !body?.role) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing userId or role" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    if (!ALLOWED_ROLES.has(body.role)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid role" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const { error: upsertError } = await supabase
      .from("user_roles")
      .upsert({ user_id: body.userId, role: body.role as any }, { onConflict: "user_id,role" });

    if (upsertError) {
      return new Response(
        JSON.stringify({ success: false, error: upsertError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, assigned_by: actorId }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: false, error: e?.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});

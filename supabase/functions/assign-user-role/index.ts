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
  permissionLevel?: string;
  eventId?: string | null;
}

serve(async (req) => {
  // Handle CORS preflight
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

    // Verify caller
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const actorId = userData.user.id;

    // Optionally, enforce that only certain roles can assign roles.
    // For now, allow any authenticated user. If you want restrictions, uncomment below and adapt:
    // const { data: actorRoles } = await supabase
    //   .from('user_roles')
    //   .select('role')
    //   .eq('user_id', actorId);
    // const allowed = actorRoles?.some(r => ['admin','event_manager'].includes(r.role));
    // if (!allowed) { return new Response(JSON.stringify({ success:false, error:'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }) }

    const body = (await req.json()) as AssignRoleRequest;
    if (!body?.userId || !body?.role) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing userId or role" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Insert role using service role to bypass RLS safely
    const insertData: Record<string, unknown> = {
      user_id: body.userId,
      role: body.role as any,
    };
    if (body.permissionLevel) {
      insertData.permission_level = body.permissionLevel;
    }
    if (body.eventId !== undefined) {
      insertData.event_id = body.eventId;
    }

    const { error: insertError } = await supabase
      .from("user_roles")
      .insert(insertData as any);

    if (insertError) {
      console.error("assign-user-role insert error", insertError);
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (e: any) {
    console.error("assign-user-role error", e);
    return new Response(
      JSON.stringify({ success: false, error: e?.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});
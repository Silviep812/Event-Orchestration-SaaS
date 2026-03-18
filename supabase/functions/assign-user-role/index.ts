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
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AssignRoleRequest {
  userId: string;
  role: string;
  permissionLevel?: string;
  eventId?: string | null;
}

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

    // Enforce that only admin users can assign roles
    const { data: actorRoles } = await supabase
      .from('user_roles')
      .select('permission_level')
      .eq('user_id', actorId);

    const isAdmin = actorRoles?.some(r => r.permission_level === 'admin');
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: only admins can assign roles' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

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
    return new Response(
      JSON.stringify({ success: false, error: "Failed to assign role" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});

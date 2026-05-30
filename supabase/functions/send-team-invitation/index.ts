import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TeamInvitationRequest {
  email: string;
  role: string;
  inviterName: string;
  inviterEmail: string;
  teamId?: string;
  isCoordinator?: boolean;
  isViewer?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: callerData, error: callerErr } = await supabase.auth.getUser(token);
    if (callerErr || !callerData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }
    const callerId = callerData.user.id;

    const {
      email,
      role,
      inviterName,
      inviterEmail,
      teamId,
      isCoordinator,
      isViewer,
    }: TeamInvitationRequest = await req.json();

    // Validate role against an allowlist; admins may grant any of these
    const ALLOWED_ROLES = new Set([
      "admin",
      "event_manager",
      "task_coordinator",
      "team_member",
      "viewer",
    ]);
    if (!ALLOWED_ROLES.has(role)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid role" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Authorize caller: must be team_admin of the target team OR an admin
    const { data: isAdmin } = await supabase.rpc("policy_has_permission_level", {
      _user_id: callerId,
      _level: "admin",
    });
    let isTeamAdmin = false;
    if (teamId) {
      const { data: ta } = await supabase.rpc("is_team_admin", {
        _user_id: callerId,
        _team_id: teamId,
      });
      isTeamAdmin = !!ta;
    }
    if (!isAdmin && !isTeamAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Only admins can grant the admin role
    if (role === "admin" && !isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Only admins can assign the admin role" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    console.log("Sending team invitation to:", email);
    console.log("Role:", role);
    console.log("Inviter:", inviterName);

    // First, check if user already exists by email
    const { data: existingUsers, error: checkError } = await supabase.auth.admin.listUsers();
    
    if (checkError) {
      console.error("Error checking existing users:", checkError);
      throw checkError;
    }

    const existingUser = existingUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      // User already exists, add them directly to the team
      console.log("User already exists, adding to team directly:", existingUser.id);
      
      // Store the role in user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: existingUser.id,
          role: role
        }, {
          onConflict: 'user_id,role'
        });

      if (roleError) {
        console.error("Error storing role in database:", roleError);
      } else {
        console.log("Role stored in database for existing user:", existingUser.id);
      }

      // Create team_assignments record if teamId provided
      if (teamId) {
        const { error: teamError } = await supabase
          .from('team_assignments')
          .upsert({
            user_id: existingUser.id,
            team_id: teamId,
            team_admin: false,
            is_collaborator: isCoordinator || false,
            is_viewer: isViewer || false,
          }, {
            onConflict: 'user_id,team_id'
          });

        if (teamError) {
          console.error("Error creating team assignment:", teamError);
        } else {
          console.log("Team assignment created for existing user:", existingUser.id);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `User ${email} added to team successfully`,
          isExistingUser: true,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // User doesn't exist, send invitation
    const { data, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        role: role,
        inviter_name: inviterName,
        inviter_email: inviterEmail
      },
      redirectTo: `${supabaseUrl.replace('//', '//').split('/')[0]}//${supabaseUrl.split('//')[1].split('.')[0]}.supabase.co/auth/v1/verify?type=invite&redirect_to=${encodeURIComponent(Deno.env.get('SITE_URL') || 'http://localhost:5173')}/dashboard`
    });

    if (inviteError) {
      throw inviteError;
    }

    // Store the role in user_roles table for the invited user
    if (data.user && data.user.id) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: data.user.id,
          role: role
        }, {
          onConflict: 'user_id,role'
        });

      if (roleError) {
        console.error("Error storing role in database:", roleError);
      } else {
        console.log("Role stored in database for user:", data.user.id);
      }

      // Create team_assignments record with attributes if teamId provided
      if (teamId) {
        const { error: teamError } = await supabase
          .from('team_assignments')
          .insert({
            user_id: data.user.id,
            team_id: teamId,
            team_admin: false,
            is_collaborator: isCoordinator || false,
            is_viewer: isViewer || false,
          });

        if (teamError) {
          console.error("Error creating team assignment:", teamError);
        } else {
          console.log("Team assignment created for user:", data.user.id);
        }
      }
    }

    console.log("Invitation sent successfully:", data);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Team invitation sent successfully to ${email}`,
        isExistingUser: false,
        data,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-team-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
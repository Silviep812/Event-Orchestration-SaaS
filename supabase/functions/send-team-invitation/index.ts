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
  collaboratorTypes?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      email,
      role,
      inviterName,
      inviterEmail,
      teamId,
      isCoordinator,
      isViewer,
      collaboratorTypes,
    }: TeamInvitationRequest = await req.json();

    // First, check if user already exists by email
    const { data: existingUsers, error: checkError } = await supabase.auth.admin.listUsers();
    
    if (checkError) {
      throw checkError;
    }

    const existingUser = existingUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      // User already exists, add them directly to the team
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: existingUser.id,
          role: role
        }, {
          onConflict: 'user_id,role'
        });

      if (roleError) {
        // Role assignment failed but continue
      }

      // Create team_assignments record if teamId provided
      if (teamId) {
        const { error: teamError } = await supabase
          .from('team_assignments')
          .upsert({
            user_id: existingUser.id,
            team_id: teamId,
            team_admin: false,
            is_coordinator: isCoordinator || false,
            is_viewer: isViewer || false,
          }, {
            onConflict: 'user_id,team_id'
          });

        if (teamError) {
          // Team assignment failed but continue
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `User added to team successfully`,
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
      redirectTo: `${Deno.env.get('SITE_URL') || Deno.env.get('APP_URL') || 'http://localhost:5173'}/dashboard`
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
        // Role assignment failed but continue
      }

      // Create team_assignments record with attributes if teamId provided
      if (teamId) {
        const { error: teamError } = await supabase
          .from('team_assignments')
          .insert({
            user_id: data.user.id,
            team_id: teamId,
            team_admin: false,
            is_coordinator: isCoordinator || false,
            is_viewer: isViewer || false,
          });

        if (teamError) {
          // Team assignment failed but continue
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Team invitation sent successfully`,
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
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Failed to process invitation" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

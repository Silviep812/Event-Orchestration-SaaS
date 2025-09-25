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

const handler = async (req: Request): Promise<Response> => {
  console.log("Get invited users function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the inviter's user ID from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log("Fetching invited users for inviter:", user.id);

    // Fetch users that were invited by this user
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      throw usersError;
    }

    // Filter users that were invited by the current user and format the data
    const invitedUsers = users.users
      .filter(u => 
        u.user_metadata?.inviter_email === user.email && 
        u.invited_at && 
        !u.email_confirmed_at // Only show pending invitations
      )
      .map(u => ({
        id: u.id,
        name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Unknown User',
        email: u.email,
        status: 'invited' as const,
        joinedAt: u.invited_at,
        avatar: u.user_metadata?.avatar_url
      }));

    // Also get confirmed users that were invited by this user
    const confirmedUsers = users.users
      .filter(u => 
        u.user_metadata?.inviter_email === user.email && 
        u.email_confirmed_at // Confirmed invitations
      )
      .map(u => ({
        id: u.id,
        name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Unknown User',
        email: u.email,
        status: 'online' as const, // Default to online for confirmed users
        joinedAt: u.created_at,
        avatar: u.user_metadata?.avatar_url
      }));

    const allTeamMembers = [...invitedUsers, ...confirmedUsers];

    console.log("Found team members:", allTeamMembers.length);

    return new Response(
      JSON.stringify({
        success: true,
        teamMembers: allTeamMembers,
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
    console.error("Error in get-invited-users function:", error);
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
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Optional: Verify JWT if provided (for logging/auditing)
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      if (authError) {
        console.warn('JWT verification failed, but continuing with service role:', authError.message);
      } else {
        console.log('Authenticated user:', user?.id);
      }
    }

    // Use service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get all profiles first (only users with profiles should be returned)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, display_name, created_at')
      .order('created_at', { ascending: false });
    
    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ users: [] }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Get unique user IDs from profiles
    const uniqueUserIds = [...new Set(profiles.map(p => p.user_id))];

    // Get auth users only for those with profiles
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    // Combine user data - only include users that have profiles
    const usersWithData = profiles
      .filter((profile: any) => uniqueUserIds.includes(profile.user_id)) // Ensure uniqueness
      .map((profile: any) => {
        const authUser = users.find((u: any) => u.id === profile.user_id);
        return {
          id: profile.user_id,
          name: profile.display_name || 'Unknown User',
          email: authUser?.email || '',
          avatar: authUser?.user_metadata?.avatar_url,
          created_at: profile.created_at
        };
      })
      // Remove duplicates by user_id
      .filter((user: any, index: number, self: any[]) => 
        index === self.findIndex((u: any) => u.id === user.id)
      );

    return new Response(
      JSON.stringify({ users: usersWithData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

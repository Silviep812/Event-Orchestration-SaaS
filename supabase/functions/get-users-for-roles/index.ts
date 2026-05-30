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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: isAdmin } = await supabaseAdmin.rpc('policy_has_permission_level', {
      _user_id: userData.user.id,
      _level: 'admin',
    });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, display_name, created_at');
    if (profilesError) throw profilesError;

    const usersWithData = profiles?.map((profile: any) => {
      const authUser = users.find((u: any) => u.id === profile.user_id);
      return {
        id: profile.user_id,
        name: profile.display_name || 'Unknown User',
        email: authUser?.email || '',
        avatar: authUser?.user_metadata?.avatar_url,
        created_at: profile.created_at,
      };
    }) || [];

    return new Response(
      JSON.stringify({ users: usersWithData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message ?? 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
});

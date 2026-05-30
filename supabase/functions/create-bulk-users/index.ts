import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Disabled dev-only endpoint. Previously created hardcoded test accounts with
// a known password and was open to the public. Kept as a no-op behind an
// admin-only gate to prevent re-introduction of the vulnerability.
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: isAdmin } = await supabaseAdmin.rpc('policy_has_permission_level', {
      _user_id: userData.user.id,
      _level: 'admin',
    });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'This dev-only endpoint has been disabled. Use the admin invite flow to create users.',
      }),
      { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error?.message ?? 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Team invitation function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      email,
      role,
      inviterName,
      inviterEmail,
    }: TeamInvitationRequest = await req.json();

    console.log("Sending team invitation to:", email);
    console.log("Role:", role);
    console.log("Inviter:", inviterName);

    const subject = `You're invited to join our Event Planning Team!`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
          Team Invitation
        </h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">You've been invited to join our team!</h3>
          
          <p style="margin: 15px 0; color: #64748b;">
            <strong>${inviterName}</strong> (${inviterEmail}) has invited you to join their event planning team as a <strong>${role}</strong>.
          </p>
          
          <div style="margin: 20px 0;">
            <p style="margin: 5px 0; color: #64748b;">
              As a team member, you'll be able to:
            </p>
            <ul style="color: #64748b; margin: 10px 0; padding-left: 20px;">
              <li>Collaborate on event planning and management</li>
              <li>Access shared files and resources</li>
              <li>Participate in team discussions</li>
              <li>Manage tasks and track progress</li>
            </ul>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token_hash=signup&type=signup&redirect_to=${encodeURIComponent(window?.location?.origin || 'https://your-app.com')}/auth?mode=signup&email=${encodeURIComponent(email)}" 
             style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Accept Invitation & Sign Up
          </a>
        </div>
        
        <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; color: #1e40af;">
            <strong>Note:</strong> This invitation will expire in 7 days. 
            If you already have an account, you can log in and the role will be automatically assigned.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
          <p>This is an automated invitation from the Event Planning System.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      </div>
    `;

    const result = await resend.emails.send({
      from: "Event Planning Team <onboarding@resend.dev>",
      to: [email],
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", result);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Team invitation sent successfully to ${email}`,
        result,
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
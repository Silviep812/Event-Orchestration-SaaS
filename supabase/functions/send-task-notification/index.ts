import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { sendEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface TaskNotificationRequest {
  taskId: string;
  taskTitle: string;
  oldEstimate?: number;
  newEstimate?: number;
  eventId?: string;
  coordinatorEmails: string[];
  changeDescription: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Task notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const {
      taskTitle,
      oldEstimate,
      newEstimate,
      coordinatorEmails,
      changeDescription,
      eventId,
    }: TaskNotificationRequest = await req.json();

    // Validate recipient emails are well-formed and de-duplicate
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipients = Array.from(
      new Set((coordinatorEmails ?? []).filter((e) => typeof e === "string" && emailRe.test(e))),
    );
    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid recipient emails" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Require eventId so we can enforce event-membership scoping
    if (!eventId) {
      return new Response(
        JSON.stringify({ error: "eventId is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const { data: isMember } = await supabase.rpc("user_is_member_of_event", {
      p_event_id: eventId,
    });
    const { data: isAdmin } = await supabase.rpc("policy_has_permission_level", {
      _user_id: userData.user.id,
      _level: "admin",
    });
    if (!isMember && !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const safeTitle = escapeHtml(taskTitle ?? "");
    const safeDescription = escapeHtml(changeDescription ?? "");
    const subject = `Task Estimate Updated: ${safeTitle}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
          Task Estimate Change Notification
        </h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Task: ${safeTitle}</h3>
          
          <div style="margin: 15px 0;">
            <strong>Estimate Change:</strong>
            <div style="margin: 5px 0;">
              <span style="color: #ef4444;">Previous: ${oldEstimate ? `${oldEstimate} hours` : "Not set"}</span>
            </div>
            <div style="margin: 5px 0;">
              <span style="color: #22c55e;">New: ${newEstimate ? `${newEstimate} hours` : "Not set"}</span>
            </div>
          </div>
          
          <div style="margin: 15px 0;">
            <strong>Description:</strong>
            <p style="margin: 5px 0; color: #64748b;">${safeDescription}</p>
          </div>
        </div>
        
        <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; color: #1e40af;">
            <strong>Note:</strong> Dependent tasks may have been automatically adjusted. 
            Please review your project timeline to ensure everything aligns with your schedule.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
          <p>This is an automated notification from your Event Planning System.</p>
        </div>
      </div>
    `;

    const results: { email: string; ok: boolean; error?: string }[] = [];
    for (const email of recipients) {
      const r = await sendEmail({
        to: [email],
        subject,
        html: htmlContent,
        template: "task_estimate_updated",
        eventId: eventId ?? null,
      });
      results.push({ email, ok: r.ok, error: r.error });
    }

    const successCount = results.filter((r) => r.ok).length;
    const failureCount = results.length - successCount;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications sent: ${successCount} successful, ${failureCount} failed`,
        results,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-task-notification function:", error);
    return new Response(
      JSON.stringify({ error: msg }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
};

serve(handler);

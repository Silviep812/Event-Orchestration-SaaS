import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChangeRequestNotificationRequest {
  change_request_id: string;
  status: string;
  event_id?: string;
  task_id?: string;
  title?: string;
  description?: string;
  priority_tag?: string;
  requested_by?: string;
  coordinatorEmails: string[];
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Change request notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: ChangeRequestNotificationRequest = await req.json();
    const {
      change_request_id,
      status,
      event_id,
      task_id,
      title,
      description,
      priority_tag,
      coordinatorEmails,
    } = payload;

    console.log("Sending notification for change request:", change_request_id);
    console.log("Status:", status);
    console.log("Recipients:", coordinatorEmails);

    if (!coordinatorEmails || coordinatorEmails.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No recipients to notify" }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Get additional details from Supabase if needed
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    let eventName = "Unknown Event";
    let taskTitle = "Unknown Task";

    if (event_id) {
      const { data: eventData } = await supabase
        .from("Create Event")
        .select("event_theme")
        .eq("userid", event_id)
        .single();

      if (eventData) {
        eventName = Array.isArray(eventData.event_theme)
          ? eventData.event_theme.join(", ")
          : eventData.event_theme || "Unknown Event";
      }
    }

    if (task_id) {
      const { data: taskData } = await supabase
        .from("tasks")
        .select("title")
        .eq("id", task_id)
        .single();

      if (taskData) {
        taskTitle = taskData.title;
      }
    }

    // Email content configuration based on status
    const statusConfig: Record<string, { subject: string; message: string; actionMessage: string; color: string }> = {
      pending: {
        subject: `New Change Request: ${title?.substring(0, 50) || "Untitled"}`,
        message: "A new change request has been created and is pending approval.",
        actionMessage: "Please review and approve or reject this change request.",
        color: "#f59e0b",
      },
      approved: {
        subject: `Change Request Approved: ${title?.substring(0, 50) || "Untitled"}`,
        message: "A change request has been approved and is ready to be applied.",
        actionMessage: "You can now apply this change request when ready.",
        color: "#3b82f6",
      },
      rejected: {
        subject: `Change Request Rejected: ${title?.substring(0, 50) || "Untitled"}`,
        message: "A change request has been rejected.",
        actionMessage: "Please review the rejection and contact the approver if needed.",
        color: "#ef4444",
      },
      applied: {
        subject: `Change Request Applied: ${title?.substring(0, 50) || "Untitled"}`,
        message: "A change request has been successfully applied.",
        actionMessage: "The changes have been implemented in the system.",
        color: "#22c55e",
      },
      cancelled: {
        subject: `Change Request Cancelled: ${title?.substring(0, 50) || "Untitled"}`,
        message: "A change request has been cancelled.",
        actionMessage: "This change request will no longer be processed.",
        color: "#6b7280",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
          Change Request Notification
        </h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <div style="margin-bottom: 15px;">
            <strong style="color: #1e293b;">Status:</strong>
            <span style="display: inline-block; padding: 4px 12px; border-radius: 4px; margin-left: 8px; background-color: ${config.color}; color: white; font-weight: bold;">
              ${status.toUpperCase()}
            </span>
          </div>
          
          ${title ? `
          <div style="margin: 15px 0;">
            <strong style="color: #1e293b;">Title:</strong>
            <p style="margin: 5px 0; color: #64748b;">${title}</p>
          </div>
          ` : ''}
          
          ${description ? `
          <div style="margin: 15px 0;">
            <strong style="color: #1e293b;">Description:</strong>
            <p style="margin: 5px 0; color: #64748b;">${description}</p>
          </div>
          ` : ''}
          
          ${priority_tag ? `
          <div style="margin: 15px 0;">
            <strong style="color: #1e293b;">Priority:</strong>
            <span style="margin-left: 8px; color: #64748b;">${priority_tag.toUpperCase()}</span>
          </div>
          ` : ''}
          
          ${event_id ? `
          <div style="margin: 15px 0;">
            <strong style="color: #1e293b;">Event:</strong>
            <span style="margin-left: 8px; color: #64748b;">${eventName}</span>
          </div>
          ` : ''}
          
          ${task_id ? `
          <div style="margin: 15px 0;">
            <strong style="color: #1e293b;">Task:</strong>
            <span style="margin-left: 8px; color: #64748b;">${taskTitle}</span>
          </div>
          ` : ''}
        </div>
        
        <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
          <p style="margin: 0; color: #1e40af;">
            <strong>${config.message}</strong>
          </p>
          <p style="margin: 10px 0 0 0; color: #1e40af;">
            ${config.actionMessage}
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
          <p>Change Request ID: ${change_request_id}</p>
          <p>This is an automated notification from your Event Planning System.</p>
          <p style="margin-top: 10px;">
            <a href="${Deno.env.get("APP_URL") || "https://your-app.com"}/dashboard/change-requests/${change_request_id}" 
               style="color: #4f46e5; text-decoration: none; font-weight: bold;">
              View Change Request →
            </a>
          </p>
        </div>
      </div>
    `;

    // Send email to all coordinators
    const emailPromises = coordinatorEmails.map((email) =>
      resend.emails.send({
        from: "Event Planning System <onboarding@resend.dev>",
        to: [email],
        subject: config.subject,
        html: htmlContent,
      })
    );

    const results = await Promise.allSettled(emailPromises);

    // Log results
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        console.log(`Email sent successfully to ${coordinatorEmails[index]}`);
      } else {
        console.error(
          `Failed to send email to ${coordinatorEmails[index]}:`,
          result.reason
        );
      }
    });

    const successCount = results.filter((r) => r.status === "fulfilled").length;
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
      }
    );
  } catch (error: any) {
    console.error("Error in send-change-request-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

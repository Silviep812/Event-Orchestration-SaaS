import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      taskTitle,
      oldEstimate,
      newEstimate,
      coordinatorEmails,
      changeDescription,
    }: TaskNotificationRequest = await req.json();

    console.log("Sending notification for task:", taskTitle);
    console.log("Recipients:", coordinatorEmails);

    const subject = `Task Estimate Updated: ${taskTitle}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
          Task Estimate Change Notification
        </h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Task: ${taskTitle}</h3>
          
          <div style="margin: 15px 0;">
            <strong>Estimate Change:</strong>
            <div style="margin: 5px 0;">
              <span style="color: #ef4444;">Previous: ${oldEstimate ? `${oldEstimate} hours` : 'Not set'}</span>
            </div>
            <div style="margin: 5px 0;">
              <span style="color: #22c55e;">New: ${newEstimate ? `${newEstimate} hours` : 'Not set'}</span>
            </div>
          </div>
          
          <div style="margin: 15px 0;">
            <strong>Description:</strong>
            <p style="margin: 5px 0; color: #64748b;">${changeDescription}</p>
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

    // Send email to all coordinators
    const emailPromises = coordinatorEmails.map(email =>
      resend.emails.send({
        from: "Event Planning System <onboarding@resend.dev>",
        to: [email],
        subject,
        html: htmlContent,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    
    // Log results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Email sent successfully to ${coordinatorEmails[index]}`);
      } else {
        console.error(`Failed to send email to ${coordinatorEmails[index]}:`, result.reason);
      }
    });

    const successCount = results.filter(r => r.status === 'fulfilled').length;
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
    console.error("Error in send-task-notification function:", error);
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
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { sendEmail, type SendEmailInput } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Payload =
  | {
      kind: "event_created" | "event_updated";
      eventTitle: string;
      eventId: string;
      userEmail: string;
      userId?: string;
      summaryHtml?: string;
    }
  | {
      kind: "change_request_status";
      eventTitle: string;
      eventId: string;
      status: string;
      userEmail: string;
      userId?: string;
    }
  | { kind: "due_soon_batch" }
  /** Deliverable 2 / SOW: daily planner summary via Resend after workflow_analytics MV refresh */
  | { kind: "daily_summary_batch" };

function cronAuthorized(req: Request): boolean {
  const secret = Deno.env.get("CRON_SECRET");
  // Fail closed: require the secret to be set AND matched
  if (!secret) return false;
  return req.headers.get("x-cron-secret") === secret;
}

function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function handleDailySummaryBatch(req: Request): Promise<Response> {
  if (!cronAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
  if (Deno.env.get("DAILY_SUMMARY_EMAILS_ENABLED") === "false") {
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: "DAILY_SUMMARY_EMAILS_ENABLED=false" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const supabase = serviceClient();

  const { error: refreshErr } = await supabase.rpc("workflow_analytics_refresh_all");
  if (refreshErr) {
    console.warn("workflow_analytics_refresh_all:", refreshErr.message);
  }

  // Aggregate from public tables (PostgREST may not expose workflow_analytics schema)
  const { data: events, error: evErr } = await supabase.from("events").select("id, title, user_id");
  if (evErr) {
    return new Response(JSON.stringify({ error: evErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
  const evList = events ?? [];
  if (evList.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0, message: "No events" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const eventIds = evList.map((e) => e.id as string);
  const { data: taskRows } = await supabase.from("tasks").select("event_id, status").in("event_id", eventIds);

  type Counts = { task_count: number; completed_task_count: number; active_task_count: number };
  const countsByEvent = new Map<string, Counts>();
  for (const eid of eventIds) {
    countsByEvent.set(eid, { task_count: 0, completed_task_count: 0, active_task_count: 0 });
  }
  for (const t of taskRows ?? []) {
    const eid = t.event_id as string;
    const c = countsByEvent.get(eid);
    if (!c) continue;
    c.task_count++;
    if (t.status === "completed") c.completed_task_count++;
    if (t.status === "not_started" || t.status === "in_progress") c.active_task_count++;
  }

  type Row = {
    event_id: string;
    user_id: string;
    task_count: number;
    completed_task_count: number;
    active_task_count: number;
    title: string;
  };
  const byUser = new Map<string, Row[]>();
  for (const ev of evList) {
    const eid = ev.id as string;
    const uid = ev.user_id as string;
    const c = countsByEvent.get(eid) ?? { task_count: 0, completed_task_count: 0, active_task_count: 0 };
    const row: Row = {
      event_id: eid,
      user_id: uid,
      task_count: c.task_count,
      completed_task_count: c.completed_task_count,
      active_task_count: c.active_task_count,
      title: (ev.title as string) ?? "Event",
    };
    if (!byUser.has(uid)) byUser.set(uid, []);
    byUser.get(uid)!.push(row);
  }

  const { data: userPage, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) {
    return new Response(JSON.stringify({ error: listErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const emailByUserId = new Map<string, string>();
  for (const u of userPage?.users ?? []) {
    if (u.email) emailByUserId.set(u.id, u.email);
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  let sent = 0;

  for (const [userId, userRows] of byUser) {
    const email = emailByUserId.get(userId);
    if (!email) continue;

    const totalTasks = userRows.reduce((s, r) => s + r.task_count, 0);
    const completed = userRows.reduce((s, r) => s + r.completed_task_count, 0);
    const active = userRows.reduce((s, r) => s + r.active_task_count, 0);

    const rowsHtml = userRows
      .map(
        (r) =>
          `<tr><td style="padding:8px;border:1px solid #ddd">${r.title}</td><td style="padding:8px;border:1px solid #ddd;text-align:right">${r.task_count}</td><td style="padding:8px;border:1px solid #ddd;text-align:right">${r.completed_task_count}</td><td style="padding:8px;border:1px solid #ddd;text-align:right">${r.active_task_count}</td></tr>`,
      )
      .join("");

    const html = `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 640px; margin: 0 auto;">
          <h2 style="color:#1a1a1a;">Daily planner summary</h2>
          <p style="color:#444;">${dateStr} · IEP Event Planner</p>
          <p><strong>Totals across your events:</strong> ${totalTasks} tasks · ${completed} completed · ${active} active</p>
          <table style="border-collapse:collapse;width:100%;margin-top:12px;font-size:14px;">
            <thead>
              <tr style="background:#f4f4f5;">
                <th style="padding:8px;border:1px solid #ddd;text-align:left">Event</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:right">Tasks</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:right">Completed</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:right">Active</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <p style="color:#666;font-size:12px;margin-top:16px;">
            Metrics from your workflow dashboard. Reply to this email or contact your organizer to adjust notifications.
          </p>
        </div>`;

    const input: SendEmailInput = {
      to: [email],
      subject: `Daily planner summary — ${dateStr}`,
      template: "daily_planner_summary",
      userId,
      html,
      metadata: { batch: "daily_summary", date: dateStr },
    };
    const r = await sendEmail(input);
    if (r.ok) sent++;
  }

  return new Response(
    JSON.stringify({ ok: true, owners: byUser.size, sent }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
}

async function handleDueSoonBatch(req: Request): Promise<Response> {
  if (!cronAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
  const supabase = serviceClient();
  const { data: rows, error } = await supabase.from("due_soon_events").select(
    "id, title, start_date, user_id",
  );
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const { data: userPage, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) {
    return new Response(JSON.stringify({ error: listErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const emailByUserId = new Map<string, string>();
  for (const u of userPage?.users ?? []) {
    if (u.email) emailByUserId.set(u.id, u.email);
  }

  let sent = 0;
  for (const row of rows ?? []) {
    const email = emailByUserId.get(row.user_id as string);
    if (!email) continue;
    const input: SendEmailInput = {
      to: [email],
      subject: `Reminder: "${row.title}" is coming up`,
      template: "due_soon_reminder",
      eventId: row.id as string,
      userId: row.user_id as string,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>Event reminder</h2>
          <p><strong>${row.title}</strong> starts on <strong>${row.start_date}</strong>.</p>
          <p>Review your checklist and confirm details in the app.</p>
        </div>`,
    };
    const r = await sendEmail(input);
    if (r.ok) sent++;
  }

  return new Response(JSON.stringify({ ok: true, checked: rows?.length ?? 0, sent }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Payload;

    if (body.kind === "due_soon_batch") {
      return await handleDueSoonBatch(req);
    }

    if (body.kind === "daily_summary_batch") {
      return await handleDailySummaryBatch(req);
    }

    // All non-cron paths require an authenticated caller; recipient must match the caller's email
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const supabaseAuth = serviceClient();
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser(token);
    if (userErr || !userData?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const callerEmail = userData.user.email.toLowerCase();
    const callerId = userData.user.id;

    // Always send to the authenticated user's own email; ignore client-provided userEmail
    const recipientEmail = callerEmail;

    // Escape any caller-controlled strings used in HTML output
    const safeTitle = escapeHtml((body as any).eventTitle ?? "");

    if (body.kind === "event_created") {
      const input: SendEmailInput = {
        to: [recipientEmail],
        subject: `Event created: ${safeTitle}`,
        template: "event_created",
        eventId: body.eventId,
        userId: callerId,
        html: `<p>Your event <strong>${safeTitle}</strong> was created.</p>`,
      };
      const r = await sendEmail(input);
      return new Response(JSON.stringify(r), {
        status: r.ok ? 200 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (body.kind === "event_updated") {
      const input: SendEmailInput = {
        to: [recipientEmail],
        subject: `Event updated: ${safeTitle}`,
        template: "event_updated",
        eventId: body.eventId,
        userId: callerId,
        html: `<p>Your event <strong>${safeTitle}</strong> was updated.</p>`,
      };
      const r = await sendEmail(input);
      return new Response(JSON.stringify(r), {
        status: r.ok ? 200 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (body.kind === "change_request_status") {
      const safeStatus = escapeHtml(body.status ?? "");
      const input: SendEmailInput = {
        to: [recipientEmail],
        subject: `Change request ${safeStatus}: ${safeTitle}`,
        template: "change_request_status",
        eventId: body.eventId,
        userId: callerId,
        html: `<p>Change request for <strong>${safeTitle}</strong> is now <strong>${safeStatus}</strong>.</p>`,
      };
      const r = await sendEmail(input);
      return new Response(JSON.stringify(r), {
        status: r.ok ? 200 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown kind" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

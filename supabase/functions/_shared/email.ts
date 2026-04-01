/**
 * Provider-agnostic email send — Resend today; swap implementation here only.
 */
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

export type SendEmailInput = {
  to: string[];
  subject: string;
  html: string;
  template: string;
  userId?: string | null;
  eventId?: string | null;
  metadata?: Record<string, unknown>;
};

const defaultFrom = () =>
  (Deno.env.get("EMAIL_FROM")?.trim() || undefined) ??
  "Event Planning System <onboarding@resend.dev>";

function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function logEmailEvent(
  input: SendEmailInput,
  recipient: string,
  status: string,
  error: string | null,
) {
  const supabase = getServiceClient();
  if (!supabase) return;
  await supabase.from("email_events").insert({
    template: input.template,
    recipient,
    status,
    error,
    user_id: input.userId ?? null,
    event_id: input.eventId ?? null,
    metadata: input.metadata ?? null,
    provider: "resend",
  });
}

export async function sendEmail(
  input: SendEmailInput,
  options?: { logToDb?: boolean },
): Promise<{ ok: boolean; error?: string; ids?: string[] }> {
  const apiKey = Deno.env.get("RESEND_API_KEY")?.trim();
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not set" };
  }

  const resend = new Resend(apiKey);
  const ids: string[] = [];

  for (const recipient of input.to) {
    const { data, error } = await resend.emails.send({
      from: defaultFrom(),
      to: [recipient],
      subject: input.subject,
      html: input.html,
    });

    if (error) {
      if (options?.logToDb !== false) {
        await logEmailEvent(input, recipient, "failed", error.message);
      }
      return { ok: false, error: error.message };
    }
    if (data?.id) ids.push(data.id);
    if (options?.logToDb !== false) {
      await logEmailEvent(input, recipient, "sent", null);
    }
  }

  return { ok: true, ids };
}

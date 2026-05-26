/**
 * Outbound email: keep all vendor-specific transport **behind** `sendEmail()`.
 * Supabase remains source of truth (`email_events` logging); templates/callers stay provider-agnostic.
 *
 * | Provider   | When to use |
 * |-----------|-------------|
 * | resend    | **Default** — set `RESEND_API_KEY` |
 * | sendgrid  | Future: add branch in `sendWithConfiguredProvider` |
 * | postmark  | Future |
 * | activecampaign | Future (often via their API, not SMTP) |
 *
 * Optional: `EMAIL_PROVIDER=resend` (default) to force selection later.
 */
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

export type SendEmailInput = {
  to: string[];
  subject: string;
  html: string;
  template: string;
  from?: string;
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

type EmailProviderId = "resend";

function configuredProvider(): EmailProviderId {
  const p = Deno.env.get("EMAIL_PROVIDER")?.trim().toLowerCase();
  if (p && p !== "resend") {
    console.warn(
      `[email] EMAIL_PROVIDER=${p} is not implemented; using resend. ` +
        "Add a branch in sendWithConfiguredProvider for SendGrid/Postmark when ready.",
    );
  }
  return "resend";
}

async function sendWithResend(
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
      from: input.from?.trim() || defaultFrom(),
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

/** Single entry for Edge Functions — implements the active provider. */
export async function sendEmail(
  input: SendEmailInput,
  options?: { logToDb?: boolean },
): Promise<{ ok: boolean; error?: string; ids?: string[] }> {
  const provider = configuredProvider();
  if (provider === "resend") {
    return sendWithResend(input, options);
  }
  return { ok: false, error: "No email provider configured" };
}

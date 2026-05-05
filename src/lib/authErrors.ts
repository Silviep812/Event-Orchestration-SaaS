/**
 * Supabase returns generic messages for email delivery failures.
 * Map them to actionable dashboard steps (SMTP, confirm email, redirect URLs).
 */

const SMTP_GUIDE = "https://supabase.com/docs/guides/auth/auth-smtp";

function looksLikeEmailDeliveryFailure(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    /confirmation email|confirm.*email|sending.*email|send.*email|email.*send|smtp|mail delivery|recovery email|password reset|magic link|otp/i.test(
      msg,
    ) ||
    /could not send|unable to send|failed to send|error sending/i.test(m) ||
    /535 |authentication failed|connection refused.*smtp/i.test(m)
  );
}

export function getAuthErrorDescription(error: { message?: string } | null): string {
  const msg = error?.message ?? "";
  if (looksLikeEmailDeliveryFailure(msg)) {
    return (
      "Supabase could not send email. Quick local dev: Dashboard → Authentication → Providers → Email → turn off “Confirm email”. " +
      "Production: Project Settings → Auth → Custom SMTP (Resend, SendGrid, etc.). " +
      `Guide: ${SMTP_GUIDE}. ` +
      "Also under Authentication → URL Configuration, set Site URL and Redirect URLs to match this app (e.g. http://localhost:8080 and http://localhost:8080/auth)."
    );
  }
  return msg || "Something went wrong.";
}

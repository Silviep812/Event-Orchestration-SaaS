/**
 * Supabase returns generic messages for email delivery failures.
 * Map them to actionable dashboard steps (SMTP, confirm email, redirect URLs).
 */
// change file
const SMTP_GUIDE = "https://supabase.com/docs/guides/auth/auth-smtp";

function looksLikeEmailDeliveryFailure(msg: string): boolean {
  const m = msg.toLowerCase();

  return (
    /confirmation email|confirm.*email|sending.*email|send.*email|email.*send|smtp|mail delivery|recovery email|password reset|magic link|otp/i.test(
      msg,
    ) || /could not send|unable to send|failed to send|error sending/i.test(m)
  );
}

export function getAuthErrorDescription(error: { message?: string } | null): string {
  const msg = error?.message ?? "";

  if (looksLikeEmailDeliveryFailure(msg)) {
    return "Password reset email could not be sent right now. Please contact support or try again later.";
  }

  return msg || "Something went wrong. Please try again.";
}

/**
 * Supabase returns generic messages for email delivery failures.
 * Map them to actionable dashboard steps (SMTP, confirm email, redirect URLs).
 */
// change file
const SMTP_GUIDE = "https://supabase.com/docs/guides/auth/auth-smtp";

/**
 * Keep auth errors user-friendly.
 * Do not expose internal Supabase setup/debug instructions to end users.
 */

/**
 * Keep auth errors user-friendly.
 * Do not expose internal Supabase setup/debug instructions to end users.
 */

type AuthErrorContext = "signup" | "password_reset" | "magic_link" | "signin" | "generic";

function looksLikeEmailDeliveryFailure(msg: string): boolean {
  const m = msg.toLowerCase();

  return (
    /confirmation email|confirm.*email|sending.*email|send.*email|email.*send|smtp|mail delivery|recovery email|password reset|magic link|otp/i.test(
      msg,
    ) || /could not send|unable to send|failed to send|error sending/i.test(m)
  );
}

function getEmailDeliveryMessage(context: AuthErrorContext): string {
  switch (context) {
    case "signup":
      return "We could not send the signup confirmation email right now. Please contact support or try again later.";

    case "password_reset":
      return "Password reset email could not be sent right now. Please contact support or try again later.";

    case "magic_link":
      return "Magic link email could not be sent right now. Please contact support or try again later.";

    default:
      return "Email could not be sent right now. Please contact support or try again later.";
  }
}

export function getAuthErrorDescription(
  error: { message?: string } | null,
  context: AuthErrorContext = "generic",
): string {
  const msg = error?.message ?? "";
  const m = msg.toLowerCase();

  if (context === "signin") {
    if (m.includes("email not confirmed") || m.includes("not confirmed")) {
      return "Your email address hasn't been confirmed yet. Open the confirmation link we emailed you, or use the Magic Link tab to sign in without a password.";
    }
    if (m.includes("invalid login credentials") || m.includes("invalid_credentials")) {
      return "That email and password combination doesn't match an account. Check for typos, or use Reset to set a new password.";
    }
    if (m.includes("too many requests") || m.includes("rate limit")) {
      return "Too many sign-in attempts. Please wait a minute and try again.";
    }
  }

  if (context === "password_reset" && (m.includes("expired") || m.includes("invalid"))) {
    return "That reset link has expired or was already used. Request a new one — links must be opened in the same browser that requested them.";
  }

  if (looksLikeEmailDeliveryFailure(msg)) {
    return getEmailDeliveryMessage(context);
  }

  return msg || "Something went wrong. Please try again.";
}

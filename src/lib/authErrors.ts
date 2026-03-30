/**
 * Supabase returns generic messages for email delivery failures.
 * Map them to actionable dashboard steps (SMTP, confirm email, redirect URLs).
 */
export function getAuthErrorDescription(error: { message?: string } | null): string {
  const msg = error?.message ?? '';
  if (/confirmation email|sending.*email|email.*send|smtp|mail delivery|recovery email|password reset/i.test(msg)) {
    return (
      'Supabase could not send email. In the Supabase dashboard: Project Settings → Auth → SMTP (set up a mail provider), ' +
      'or Authentication → Providers → Email → turn off “Confirm email” for development. ' +
      'Add your site URL and redirect paths under Authentication → URL Configuration.'
    );
  }
  return msg || 'Something went wrong.';
}

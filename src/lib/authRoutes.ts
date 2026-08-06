/** Public auth destinations — keep paths aligned with `App.tsx` `/auth` route. */
export const AUTH_SIGN_IN_PATH = "/auth?tab=signin";
export const AUTH_SIGN_UP_PATH = "/auth?tab=signup";
/** Starter Plan CTAs open the existing sign-up tab (no Stripe in Task 1). */
export const AUTH_STARTER_PLAN_PATH = AUTH_SIGN_UP_PATH;
/** Where users ask for a reset email. */
export const AUTH_RESET_PASSWORD_REQUEST_PATH = "/auth?tab=reset";
/** Where Supabase recovery emails land (public route that sets the new password). */
export const AUTH_RESET_PASSWORD_PATH = "/reset-password";

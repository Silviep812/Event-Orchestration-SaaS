import type { SupabaseClient } from "@supabase/supabase-js";

/** Users who already have at least one event — full create flow. */
export const CREATE_EVENT_PATH_RETURNING = "/dashboard/create-event";

/** First-time users with no events yet — start from Browse Event Themes, then Create Event with theme context. */
export const CREATE_EVENT_PATH_NEW_PLANNER = "/dashboard/themes";

/** Default dashboard index when no special post-sign-in redirect applies. */
export const POST_SIGN_IN_HOME_PATH = "/dashboard";

/** Users who already have events: land on Manage Event. */
export const POST_SIGN_IN_MANAGE_EVENT_PATH = "/dashboard/manage-event";

/**
 * Email confirmations, magic links, and OAuth should use this route so post-sign-in routing runs in `Auth`
 * (first-time users with no events go to themes; others go to Manage Event).
 */
export const AUTH_EMAIL_OAUTH_CALLBACK_PATH = "/auth";

/**
 * Where “Create event” should send the user: themes first when the user has no events yet,
 * otherwise the full create-event flow.
 */
export async function getCreateEventEntryPath(client: SupabaseClient): Promise<string> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return CREATE_EVENT_PATH_NEW_PLANNER;

  const { count, error } = await client
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) {
    console.error("getCreateEventEntryPath:", error);
    return CREATE_EVENT_PATH_RETURNING;
  }

  return (count ?? 0) === 0 ? CREATE_EVENT_PATH_NEW_PLANNER : CREATE_EVENT_PATH_RETURNING;
}

/**
 * First screen **immediately after authentication** (use from Auth / session callback only).
 * Do not call this from the Dashboard index route — users who click “Dashboard” in the sidebar
 * should stay on `/dashboard` and see the home dashboard.
 *
 * Users with no events yet → Browse Themes; users with events → Manage Event.
 */
export async function getPostSignInDashboardPath(client: SupabaseClient): Promise<string> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return POST_SIGN_IN_HOME_PATH;

  const { count, error } = await client
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) {
    console.error("getPostSignInDashboardPath:", error);
    return POST_SIGN_IN_HOME_PATH;
  }

  return (count ?? 0) === 0 ? CREATE_EVENT_PATH_NEW_PLANNER : POST_SIGN_IN_MANAGE_EVENT_PATH;
}

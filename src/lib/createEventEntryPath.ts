import type { SupabaseClient } from "@supabase/supabase-js";

/** Returning planners who already have at least one event — full create flow. */
export const CREATE_EVENT_PATH_RETURNING = "/dashboard/create-event";

/** New planner (no events yet) — start from Browse Event Themes, then Create Event with theme context. */
export const CREATE_EVENT_PATH_NEW_PLANNER = "/dashboard/themes";

/**
 * Where “Create event” should send the user: themes first for brand-new planners,
 * create-event for returning users who already have events.
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

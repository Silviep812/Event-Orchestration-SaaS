import type { SupabaseClient } from "@supabase/supabase-js";
import { getPostSignInDashboardPath } from "@/lib/createEventEntryPath";

/**
 * True until the user finishes `/onboarding` (sets `profiles.onboarding_completed_at`).
 * New signups get NULL from `handle_new_user_profile`; existing rows were backfilled to `now()`.
 */
export async function profileNeedsOnboarding(client: SupabaseClient): Promise<boolean> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return false;

  const { data, error } = await client
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.warn("profileNeedsOnboarding:", error.message);
    return false;
  }

  if (!data) return true;
  return data.onboarding_completed_at == null;
}

/** Post-auth destination: onboarding first when required, else themes / manage-event / dashboard logic. */
export async function getPostSignInNavigationPath(client: SupabaseClient): Promise<string> {
  if (await profileNeedsOnboarding(client)) return "/onboarding";
  return getPostSignInDashboardPath(client);
}

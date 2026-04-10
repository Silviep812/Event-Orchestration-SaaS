/** Trial restrictions disabled for production client use. */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export async function countActiveEventsForUser(
  userId: string,
  supabase: SupabaseClient<Database>,
): Promise<number> {
  const { count, error } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("archived", false);

  if (error) throw error;
  return count ?? 0;
}

export async function assertCanCreateEvent(
  _userId: string,
  _supabase: SupabaseClient<Database>,
): Promise<{ ok: boolean; message?: string }> {
  return { ok: true };
}

export function trialBannerText(): string | null {
  return null;
}

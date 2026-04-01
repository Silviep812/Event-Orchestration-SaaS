/** Trial caps (Deliverable 2). Override via Vite env. */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const maxActive = () =>
  Number(import.meta.env.VITE_TRIAL_MAX_ACTIVE_EVENTS ?? 1);

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
  userId: string,
  supabase: SupabaseClient<Database>,
): Promise<{ ok: boolean; message?: string }> {
  const n = await countActiveEventsForUser(userId, supabase);
  const cap = maxActive();
  if (n >= cap) {
    return {
      ok: false,
      message: `Trial limit: at most ${cap} active event(s). Archive an event or upgrade to add more.`,
    };
  }
  return { ok: true };
}

export function trialBannerText(): string | null {
  if (import.meta.env.VITE_TRIAL_BANNER === "0") return null;
  return "Trial mode: limited events and features.";
}

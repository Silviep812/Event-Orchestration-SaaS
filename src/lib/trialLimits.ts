import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const MAX_STARTER_EVENTS = Number(
  import.meta.env.VITE_TRIAL_MAX_ACTIVE_EVENTS ?? 100,
);

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

async function getUserPlan(
  userId: string,
  supabase: SupabaseClient<Database>,
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("subscription_plan")
    .eq("id", userId)
    .maybeSingle();
  return (data as any)?.subscription_plan || "starter";
}

export async function assertCanCreateEvent(
  userId: string,
  supabase: SupabaseClient<Database>,
): Promise<{ ok: boolean; message?: string }> {
  const plan = await getUserPlan(userId, supabase);
  if (plan === "pro" || plan === "business") return { ok: true };

  const count = await countActiveEventsForUser(userId, supabase);
  if (count >= MAX_STARTER_EVENTS) {
    return {
      ok: false,
      message: `Starter plan allows up to ${MAX_STARTER_EVENTS} active events. Upgrade to Pro for unlimited events.`,
    };
  }
  return { ok: true };
}

export function trialBannerText(): string | null {
  return null;
}

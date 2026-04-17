import type { SupabaseClient } from "@supabase/supabase-js";

/** Records one Trial signup conversion per auth user (unique index + RLS). */
export async function recordMarketingTrialConversion(
  supabase: SupabaseClient,
  authUserId: string,
): Promise<{ ok: boolean; skipped?: boolean }> {
  const { error } = await supabase.from("marketing_conversions").insert({
    conversion_type: "Trial signup",
    auth_user_id: authUserId,
  });
  if (!error) return { ok: true };
  const code = (error as { code?: string }).code;
  const msg = (error.message ?? "").toLowerCase();
  if (code === "23505" || msg.includes("duplicate") || msg.includes("unique")) {
    return { ok: true, skipped: true };
  }
  console.warn("recordMarketingTrialConversion:", error.message);
  return { ok: false };
}

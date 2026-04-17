import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function displayNameFromSession(u: User): string {
  const meta = u.user_metadata as Record<string, unknown> | undefined;
  const full =
    typeof meta?.full_name === "string"
      ? meta.full_name
      : typeof meta?.name === "string"
        ? meta.name
        : "";
  if (full.trim()) return full.trim();
  if (u.email) {
    const local = u.email.split("@")[0];
    if (local) return local;
  }
  return "Member";
}

export async function resolveAuthorDisplayNameForInsert(u: User): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("user_id", u.id)
    .maybeSingle();
  const fromProfile = data?.display_name?.trim() || data?.username?.trim();
  if (fromProfile) return fromProfile;
  return displayNameFromSession(u);
}

/** Snapshot at post time so other users can load the image (they cannot read your private `profiles` row). */
export async function resolveAuthorAvatarUrlForInsert(u: User): Promise<string | null> {
  const { data: priv } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("user_id", u.id)
    .maybeSingle();
  const fromPriv = priv?.avatar_url?.trim();
  if (fromPriv) return fromPriv;
  const { data: pub } = await supabase
    .from("public_profiles")
    .select("avatar_url")
    .eq("user_id", u.id)
    .maybeSingle();
  const fromPub = pub?.avatar_url?.trim();
  return fromPub || null;
}

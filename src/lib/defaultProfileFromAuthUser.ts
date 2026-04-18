import type { User } from "@supabase/supabase-js";

/** Initial `profiles` row when none exists: derive from auth email + metadata (sign-up fields). */
export function defaultProfileFromAuthUser(user: User): { username: string; display_name: string } {
  const email = user.email?.trim() ?? "";
  const localPart = email.includes("@") ? email.slice(0, email.indexOf("@")) : email;
  const safeLocal = localPart.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 120) || "user";

  const meta = user.user_metadata ?? {};
  const fullName =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    "";

  const displayName =
    fullName ||
    safeLocal
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() ||
    "New user";

  return { username: safeLocal || "user", display_name: displayName };
}

/** Optional Change Management table prefix (Vite: VITE_PUBLIC_CM_PREFIX or VITE_CM_PREFIX). */
export function getCmPrefix(): string {
  const a = import.meta.env.VITE_PUBLIC_CM_PREFIX;
  const b = import.meta.env.VITE_CM_PREFIX;
  return String(a ?? b ?? "").trim();
}

/** Reserved for future use; returns nothing in the sidebar today. */
export function cmSidebarFooterText(): string | null {
  return null;
}

/**
 * Change Management data prefix for dev/staging (Vite: VITE_PUBLIC_CM_PREFIX or VITE_CM_PREFIX).
 * Lovable docs reference NEXT_PUBLIC_CM_PREFIX — map to VITE_ in this app.
 *
 * Sidebar no longer shows a technical “data mode” line to planners; use env + logs locally if needed.
 */
export function getCmPrefix(): string {
  const a = import.meta.env.VITE_PUBLIC_CM_PREFIX;
  const b = import.meta.env.VITE_CM_PREFIX;
  return String(a ?? b ?? "").trim();
}

/** Reserved for future diagnostics; planners should not see CM prefix strings in the UI. */
export function cmSidebarFooterText(): string | null {
  return null;
}

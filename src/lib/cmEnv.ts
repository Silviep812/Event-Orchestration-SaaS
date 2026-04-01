/**
 * CM MVP checklist (docs/assets): Lovable docs use NEXT_PUBLIC_CM_PREFIX — Vite only
 * exposes variables prefixed with VITE_. Set VITE_PUBLIC_CM_PREFIX=cm_ (or VITE_CM_PREFIX).
 */
export function getCmPrefix(): string {
  const a = import.meta.env.VITE_PUBLIC_CM_PREFIX;
  const b = import.meta.env.VITE_CM_PREFIX;
  return String(a ?? b ?? "").trim();
}

export function cmSidebarFooterText(): string | null {
  const p = getCmPrefix();
  if (!p) return null;
  return `Data mode: Change Management (${p})`;
}

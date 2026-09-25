/**
 * Pure helpers for the Change Management Manager Dashboard
 * (Change_Management_Manager_Dashboard_Overview.pdf, sections 3, 6 and 7).
 *
 * These operate on rows from the `unified_change_requests` view, which unions
 * cm_change_requests with the legacy change_requests table. Reading cm_* alone
 * under-reports history by more than 90%, so callers should query the view.
 */

/** Alert thresholds from the doc, section 7. */
export const CM_ALERT_THRESHOLDS = {
  urgentRequestsPerEvent: 5,
  resourceUtilizationPct: 90,
} as const;

export type UnifiedChangeRequestRow = {
  source: string;
  event_id: string | null;
  priority_tag: string | null;
  status: string | null;
  created_at: string | null;
  resolved_at: string | null;
};

/** Doc section 4: "Change Request Counts by Priority". Unlabelled rows group as Unspecified. */
export function changeRequestsByPriority(
  rows: UnifiedChangeRequestRow[],
): { priority: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const label = (r.priority_tag ?? "").trim() || "Unspecified";
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([priority, count]) => ({ priority, count }))
    .sort((a, b) => b.count - a.count || a.priority.localeCompare(b.priority));
}

/** Doc section 3A: "Table: Latest requests with ... approval status". */
export function changeRequestsByStatus(
  rows: UnifiedChangeRequestRow[],
): { status: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const label = (r.status ?? "").trim() || "Unspecified";
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));
}

/**
 * Doc section 6: "Percentage of Urgent vs Optional requests".
 * Returns null rather than 0 for an empty set, so the UI can distinguish
 * "no requests yet" from "no urgent requests".
 */
export function urgentRequestSharePct(rows: UnifiedChangeRequestRow[]): number | null {
  if (rows.length === 0) return null;
  const urgent = rows.filter((r) => (r.priority_tag ?? "").trim().toLowerCase() === "urgent").length;
  return Math.round((urgent / rows.length) * 1000) / 10;
}

/**
 * Doc section 7: "Alert when Urgent requests > 5 per event".
 * Only events that breach the threshold are returned, most urgent first.
 */
export function eventsBreachingUrgentThreshold(
  rows: UnifiedChangeRequestRow[],
  threshold: number = CM_ALERT_THRESHOLDS.urgentRequestsPerEvent,
): { event_id: string; urgentCount: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    if ((r.priority_tag ?? "").trim().toLowerCase() !== "urgent") continue;
    if (!r.event_id) continue;
    map.set(r.event_id, (map.get(r.event_id) ?? 0) + 1);
  }
  return [...map.entries()]
    .filter(([, urgentCount]) => urgentCount > threshold)
    .map(([event_id, urgentCount]) => ({ event_id, urgentCount }))
    .sort((a, b) => b.urgentCount - a.urgentCount);
}

/**
 * Doc section 6: "Average change request resolution time".
 * Counts only resolved rows with a usable pair of timestamps; returns null when
 * nothing is resolved yet. Negative spans (resolved before created) are treated as
 * bad data and skipped rather than dragging the average down.
 */
export function averageResolutionHours(rows: UnifiedChangeRequestRow[]): number | null {
  const spans: number[] = [];
  for (const r of rows) {
    if (!r.created_at || !r.resolved_at) continue;
    const created = Date.parse(r.created_at);
    const resolved = Date.parse(r.resolved_at);
    if (Number.isNaN(created) || Number.isNaN(resolved)) continue;
    const hours = (resolved - created) / 3_600_000;
    if (hours < 0) continue;
    spans.push(hours);
  }
  if (spans.length === 0) return null;
  const mean = spans.reduce((sum, h) => sum + h, 0) / spans.length;
  return Math.round(mean * 10) / 10;
}

/** Splits the feed by origin so a manager can see how much predates the cm_ schema. */
export function requestCountsBySource(
  rows: UnifiedChangeRequestRow[],
): { source: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const label = (r.source ?? "").trim() || "unknown";
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));
}

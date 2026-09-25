import { describe, expect, it } from "vitest";
import {
  averageResolutionHours,
  changeRequestsByPriority,
  changeRequestsByStatus,
  eventsBreachingUrgentThreshold,
  requestCountsBySource,
  urgentRequestSharePct,
  type UnifiedChangeRequestRow,
} from "./changeManagementDashboardMetrics";

const row = (over: Partial<UnifiedChangeRequestRow> = {}): UnifiedChangeRequestRow => ({
  source: "cm",
  event_id: "e1",
  priority_tag: null,
  status: "pending",
  created_at: "2026-09-01T00:00:00Z",
  resolved_at: null,
  ...over,
});

describe("changeManagementDashboardMetrics", () => {
  it("groups by priority and labels untagged rows Unspecified", () => {
    // Mirrors the live unified_change_requests distribution: 66 medium, 5 null, 1 high.
    const rows = [
      ...Array.from({ length: 66 }, () => row({ source: "legacy", priority_tag: "medium" })),
      ...Array.from({ length: 5 }, () => row({ priority_tag: null })),
      row({ source: "legacy", priority_tag: "high" }),
    ];
    expect(changeRequestsByPriority(rows)).toEqual([
      { priority: "medium", count: 66 },
      { priority: "Unspecified", count: 5 },
      { priority: "high", count: 1 },
    ]);
  });

  it("groups by status", () => {
    const rows = [
      row({ status: "applied" }),
      row({ status: "applied" }),
      row({ status: "rejected" }),
    ];
    expect(changeRequestsByStatus(rows)).toEqual([
      { status: "applied", count: 2 },
      { status: "rejected", count: 1 },
    ]);
  });

  it("reports urgent share, and null for an empty feed", () => {
    expect(urgentRequestSharePct([])).toBeNull();
    const rows = [
      row({ priority_tag: "Urgent" }),
      row({ priority_tag: "urgent" }),
      row({ priority_tag: "medium" }),
      row({ priority_tag: "medium" }),
    ];
    // Case-insensitive: 2 of 4.
    expect(urgentRequestSharePct(rows)).toBe(50);
  });

  it("flags only events above the urgent threshold", () => {
    const rows = [
      ...Array.from({ length: 6 }, () => row({ event_id: "busy", priority_tag: "urgent" })),
      ...Array.from({ length: 5 }, () => row({ event_id: "at-limit", priority_tag: "urgent" })),
      row({ event_id: "quiet", priority_tag: "medium" }),
    ];
    // Threshold is "> 5", so exactly 5 must not alert.
    expect(eventsBreachingUrgentThreshold(rows)).toEqual([{ event_id: "busy", urgentCount: 6 }]);
  });

  it("averages resolution time, ignoring unresolved and malformed rows", () => {
    expect(averageResolutionHours([row()])).toBeNull();
    const rows = [
      row({ created_at: "2026-09-01T00:00:00Z", resolved_at: "2026-09-01T02:00:00Z" }),
      row({ created_at: "2026-09-01T00:00:00Z", resolved_at: "2026-09-01T04:00:00Z" }),
      row({ created_at: "2026-09-01T00:00:00Z", resolved_at: null }),
      // Resolved before created: bad data, must not drag the mean down.
      row({ created_at: "2026-09-05T00:00:00Z", resolved_at: "2026-09-01T00:00:00Z" }),
      row({ created_at: "not-a-date", resolved_at: "2026-09-01T00:00:00Z" }),
    ];
    expect(averageResolutionHours(rows)).toBe(3);
  });

  it("splits counts by source so legacy volume stays visible", () => {
    const rows = [
      ...Array.from({ length: 67 }, () => row({ source: "legacy" })),
      ...Array.from({ length: 5 }, () => row({ source: "cm" })),
    ];
    expect(requestCountsBySource(rows)).toEqual([
      { source: "legacy", count: 67 },
      { source: "cm", count: 5 },
    ]);
  });
});

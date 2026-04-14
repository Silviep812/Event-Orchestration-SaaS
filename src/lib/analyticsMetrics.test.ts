import { describe, expect, it } from "vitest";
import {
  buildResourceUtilizationChart,
  buildTaskCompletionChart,
  computeAnalyticsKpis,
  taskDurationHours,
} from "./analyticsMetrics";

describe("taskDurationHours", () => {
  it("prefers positive actual_hours", () => {
    expect(taskDurationHours({ actual_hours: 2, estimated_hours: 5 })).toBe(2);
  });

  it("uses estimated_hours when actual is missing", () => {
    expect(taskDurationHours({ estimated_hours: 3 })).toBe(3);
  });

  it("derives span from start_date and end_date", () => {
    expect(
      taskDurationHours({
        start_date: "2025-01-01",
        end_date: "2025-01-02",
      }),
    ).toBe(24);
  });

  it("returns 0 when nothing usable", () => {
    expect(taskDurationHours({ status: "not_started" })).toBe(0);
  });
});

describe("computeAnalyticsKpis", () => {
  it("computes completion rate", () => {
    const k = computeAnalyticsKpis([
      { status: "completed" },
      { status: "completed" },
      { status: "not_started" },
    ]);
    expect(k.totalTasks).toBe(3);
    expect(k.completedTasks).toBe(2);
    expect(k.taskCompletionRate).toBe("66.7");
  });

  it("resource utilization uses hours ratio when estimates exist", () => {
    const k = computeAnalyticsKpis([
      { status: "completed", estimated_hours: 10, actual_hours: 5 },
    ]);
    expect(k.resourceUtilizationRate).toBe("50.0");
    expect(k.resourceUtilizationDetail).toContain("Logged hours");
  });

  it("falls back to active/total when no estimates", () => {
    const k = computeAnalyticsKpis([
      { status: "in_progress" },
      { status: "completed" },
    ]);
    expect(k.resourceUtilizationRate).toBe("50.0");
    expect(k.resourceUtilizationDetail).toContain("Active tasks");
  });

  it("counts active tasks as not_started, in_progress, and on_hold", () => {
    const k = computeAnalyticsKpis([
      { status: "not_started" },
      { status: "in_progress" },
      { status: "on_hold" },
      { status: "completed" },
    ]);
    expect(k.activeTasks).toBe(3);
    expect(k.totalTasks).toBe(4);
  });
});

describe("charts", () => {
  it("buildTaskCompletionChart", () => {
    const rows = buildTaskCompletionChart(1, [
      { status: "completed" },
      { status: "in_progress" },
      { status: "not_started" },
      { status: "on_hold" },
    ]);
    expect(rows.find((r) => r.status === "Completed")?.value).toBe(1);
  });

  it("buildResourceUtilizationChart hours branch", () => {
    const c = buildResourceUtilizationChart(10, 4, 0, 1);
    expect(c[0].category).toBe("Estimated hours");
  });
});

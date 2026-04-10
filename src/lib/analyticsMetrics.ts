/**
 * Pure analytics helpers used by `Analytics.tsx`.
 * Covered by `src/lib/analyticsMetrics.test.ts` so KPI formulas stay stable.
 */

export type TaskLike = {
  status?: string | null;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  start_date?: string | null;
  end_date?: string | null;
};

export function taskDurationHours(task: TaskLike): number {
  const h = task.actual_hours ?? task.estimated_hours;
  if (h != null && Number(h) > 0) return Number(h);
  if (task.start_date && task.end_date) {
    const ms = new Date(task.end_date).getTime() - new Date(task.start_date).getTime();
    if (ms > 0) return ms / (3600 * 1000);
  }
  return 0;
}

export type ComputedAnalyticsKpis = {
  completedTasks: number;
  activeTasks: number;
  totalTasks: number;
  taskCompletionRate: string;
  avgTaskDuration: number;
  durationSampleCount: number;
  sumEstimated: number;
  sumActual: number;
  resourceUtilizationRate: string;
  resourceUtilizationDetail: string;
};

export function computeAnalyticsKpis(tasks: TaskLike[]): ComputedAnalyticsKpis {
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const activeTasks = tasks.filter((t) =>
    ["not_started", "in_progress", "on_hold"].includes(String(t.status ?? "")),
  ).length;
  const totalTasks = tasks.length;
  const taskCompletionRate =
    totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : "0";

  const durationSamples = tasks.map(taskDurationHours).filter((h) => h > 0);
  const avgTaskDuration =
    durationSamples.length > 0
      ? durationSamples.reduce((a, b) => a + b, 0) / durationSamples.length
      : 0;

  const sumEstimated = tasks.reduce((a, t) => a + (Number(t.estimated_hours) || 0), 0);
  const sumActual = tasks.reduce((a, t) => a + (Number(t.actual_hours) || 0), 0);

  let resourceUtilizationRate: string;
  let resourceUtilizationDetail: string;
  if (sumEstimated > 0) {
    resourceUtilizationRate = Math.min(100, (sumActual / sumEstimated) * 100).toFixed(1);
    resourceUtilizationDetail = "Logged hours ÷ estimated (capped at 100%)";
  } else if (totalTasks > 0) {
    resourceUtilizationRate = ((activeTasks / totalTasks) * 100).toFixed(1);
    resourceUtilizationDetail = "Active tasks ÷ total (no estimates yet)";
  } else {
    resourceUtilizationRate = "0";
    resourceUtilizationDetail = "No tasks in scope";
  }

  return {
    completedTasks,
    activeTasks,
    totalTasks,
    taskCompletionRate,
    avgTaskDuration,
    durationSampleCount: durationSamples.length,
    sumEstimated,
    sumActual,
    resourceUtilizationRate,
    resourceUtilizationDetail,
  };
}

export function buildTaskCompletionChart(completedTasks: number, tasks: TaskLike[]) {
  return [
    { status: "Completed", value: completedTasks, color: "#22c55e" },
    {
      status: "In Progress",
      value: tasks.filter((t) => t.status === "in_progress").length,
      color: "#f59e0b",
    },
    {
      status: "Pending",
      value: tasks.filter((t) => t.status === "not_started").length,
      color: "#ef4444",
    },
    {
      status: "On Hold",
      value: tasks.filter((t) => t.status === "on_hold").length,
      color: "#6b7280",
    },
  ];
}

export function buildResourceUtilizationChart(
  sumEstimated: number,
  sumActual: number,
  activeTasks: number,
  totalTasks: number,
): { category: string; value: number }[] {
  if (sumEstimated > 0) {
    return [
      { category: "Estimated hours", value: Math.round(sumEstimated * 10) / 10 },
      { category: "Logged hours", value: Math.round(sumActual * 10) / 10 },
    ];
  }
  if (totalTasks > 0) {
    return [
      { category: "Active tasks", value: activeTasks },
      { category: "Other statuses", value: Math.max(0, totalTasks - activeTasks) },
    ];
  }
  return [];
}

/** IEP Change Management Rollout — timing class on `cm_change_requests.rollout_timing`. */
export type RolloutTiming = "urgent" | "optional" | "deferred";

export const ROLLOUT_TIMING_LABELS: Record<RolloutTiming, string> = {
  urgent: "Urgent",
  optional: "Optional",
  deferred: "Deferred",
};

/** Maps rollout class to task.priority for the linked coordinator task. */
export function taskPriorityFromRollout(rollout: RolloutTiming): "low" | "medium" | "high" | "urgent" {
  if (rollout === "urgent") return "urgent";
  if (rollout === "deferred") return "low";
  return "medium";
}

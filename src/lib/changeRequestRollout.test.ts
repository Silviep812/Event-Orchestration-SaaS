import { describe, expect, it } from "vitest";
import { ROLLOUT_TIMING_LABELS, taskPriorityFromRollout } from "./changeRequestRollout";

describe("changeRequestRollout", () => {
  it("maps rollout timing to task priority", () => {
    expect(taskPriorityFromRollout("urgent")).toBe("urgent");
    expect(taskPriorityFromRollout("optional")).toBe("medium");
    expect(taskPriorityFromRollout("deferred")).toBe("low");
  });

  it("exposes human labels for each rollout class", () => {
    expect(ROLLOUT_TIMING_LABELS.urgent).toBe("Urgent");
    expect(ROLLOUT_TIMING_LABELS.optional).toBe("Optional");
    expect(ROLLOUT_TIMING_LABELS.deferred).toBe("Deferred");
  });
});

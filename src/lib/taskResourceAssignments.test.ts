import { describe, expect, it } from "vitest";
import {
  buildTaskResourceAssignmentsPayload,
  parseTaskResourceAssignments,
} from "./taskResourceAssignments";

describe("taskResourceAssignments", () => {
  it("parses links array", () => {
    expect(
      parseTaskResourceAssignments({
        links: [{ resource_id: "a", name: "Stage" }, { resource_id: "b" }],
      }),
    ).toEqual([
      { resource_id: "a", name: "Stage" },
      { resource_id: "b", name: undefined },
    ]);
  });

  it("returns empty for invalid", () => {
    expect(parseTaskResourceAssignments(null)).toEqual([]);
    expect(parseTaskResourceAssignments({})).toEqual([]);
    expect(parseTaskResourceAssignments([])).toEqual([]);
  });

  it("builds payload", () => {
    expect(buildTaskResourceAssignmentsPayload([])).toBeNull();
    expect(buildTaskResourceAssignmentsPayload([{ resource_id: "x" }])).toEqual({
      links: [{ resource_id: "x" }],
    });
  });
});

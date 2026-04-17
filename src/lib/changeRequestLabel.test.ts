import { describe, expect, it } from "vitest";
import { buildChangeRequestInterpretation, parseBracketedTaskTitle } from "./changeRequestLabel";

describe("parseBracketedTaskTitle", () => {
  it("parses collaborator-style titles", () => {
    const r = parseBracketedTaskTitle("[change request] Update seating chart");
    expect(r.bracketedType).toBe("change request");
    expect(r.subject).toBe("Update seating chart");
    expect(r.changeType).toBe("change request");
  });

  it("returns subject-only when no bracket", () => {
    const r = parseBracketedTaskTitle("Plain title");
    expect(r.bracketedType).toBeNull();
    expect(r.subject).toBe("Plain title");
  });
});

describe("buildChangeRequestInterpretation", () => {
  it("merges event context", () => {
    const r = buildChangeRequestInterpretation({
      taskTitle: "[escalation] Need AV review",
      description: "Details…",
      fieldChanged: "pm_collaborator_request",
      event: {
        eventTitle: "Annual Gala",
        eventDate: "2026-06-01",
        themeName: "Corporate",
        categoryName: "Conference",
      },
    });
    expect(r.eventTitle).toBe("Annual Gala");
    expect(r.eventDate).toBe("2026-06-01");
    expect(r.themeName).toBe("Corporate");
    expect(r.categoryName).toBe("Conference");
    expect(r.bracketedType).toBe("escalation");
    expect(r.subject).toBe("Need AV review");
  });
});

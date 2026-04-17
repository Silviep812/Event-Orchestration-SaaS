import { describe, expect, it } from "vitest";
import { deriveCalendarEntryKind, stripCalendarKindPrefix } from "./calendarEntryKind";

describe("deriveCalendarEntryKind", () => {
  it("detects meeting prefix", () => {
    expect(
      deriveCalendarEntryKind({
        title: "[Meeting] Stand-up with venue",
        status: "planning",
        event_types: { name: "Gala" },
      }),
    ).toBe("meeting");
  });

  it("detects meeting from type name", () => {
    expect(
      deriveCalendarEntryKind({
        title: "Vendor sync",
        status: null,
        event_types: { name: "Pre-event briefing" },
      }),
    ).toBe("meeting");
  });

  it("strips prefix for display", () => {
    expect(stripCalendarKindPrefix("[Meeting]  Budget review")).toBe("Budget review");
  });
});

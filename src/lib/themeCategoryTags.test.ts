import { describe, expect, it } from "vitest";
import {
  dedupeEventTypeRowsByName,
  eventTypeNameKey,
  mergeThemeCategoryTags,
} from "@/lib/eventTypeCategories";

describe("eventTypeNameKey", () => {
  it("ignores case and repeated whitespace", () => {
    expect(eventTypeNameKey("  Fine   Dining ")).toBe("fine dining");
    expect(eventTypeNameKey("FINE DINING")).toBe(eventTypeNameKey("fine dining"));
  });

  it("returns an empty key for blank names", () => {
    expect(eventTypeNameKey(null)).toBe("");
    expect(eventTypeNameKey("   ")).toBe("");
  });
});

describe("dedupeEventTypeRowsByName", () => {
  it("collapses duplicate category labels (Create event > category double entries)", () => {
    const rows = [
      { id: 12, name: "Contemporary" },
      { id: 40, name: "contemporary" },
      { id: 13, name: "Buffet" },
    ];

    expect(dedupeEventTypeRowsByName(rows).map((r) => r.id)).toEqual([12, 13]);
  });

  it("keeps the duplicate that actually has children", () => {
    const rows = [
      { id: 12, name: "Contemporary" },
      { id: 40, name: "Contemporary" },
    ];
    const childCount = (id: number) => (id === 40 ? 5 : 0);

    expect(dedupeEventTypeRowsByName(rows, childCount).map((r) => r.id)).toEqual([40]);
  });

  it("drops rows with no usable name", () => {
    expect(dedupeEventTypeRowsByName([{ id: 1, name: "  " }, { id: 2, name: null }])).toEqual([]);
  });
});

describe("mergeThemeCategoryTags", () => {
  it("prefers event_types category names and never duplicates a badge", () => {
    expect(mergeThemeCategoryTags(["contemporary", "Legacy tag"], ["Contemporary", "Buffet"])).toEqual([
      "Contemporary",
      "Buffet",
      "Legacy tag",
    ]);
  });

  it("surfaces categories that the legacy tags column never listed (Festival > Heritage)", () => {
    expect(mergeThemeCategoryTags(["Cultural", "Community"], ["Cultural", "Community", "Heritage"])).toEqual([
      "Cultural",
      "Community",
      "Heritage",
    ]);
  });

  it("falls back to the tags column when a theme has no event_types rows yet", () => {
    expect(mergeThemeCategoryTags(["Holidays", "Personal"], [])).toEqual(["Holidays", "Personal"]);
  });
});

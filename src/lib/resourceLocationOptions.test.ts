import { describe, expect, it } from "vitest";
import {
  buildResourceLocationOptions,
  formatServiceArea,
} from "./resourceLocationOptions";

describe("resourceLocationOptions", () => {
  it("formats a service area as 'City, ST'", () => {
    expect(formatServiceArea({ city: "Baltimore", state: "MD" })).toBe("Baltimore, MD");
  });

  it("omits a missing half instead of leaving a stray comma", () => {
    expect(formatServiceArea({ city: "Brooklyn", state: null })).toBe("Brooklyn");
    expect(formatServiceArea({ city: null, state: "NY" })).toBe("NY");
    expect(formatServiceArea({ city: "  ", state: null })).toBe("");
  });

  it("offers all 11 supported states, not just the Maryland test data", () => {
    // The defect: resources.location held MD rows plus unstructured junk, so the picker
    // could not search the other ten states.
    const serviceAreas = [
      { city: "Washington", state: "DC" },
      { city: "Baltimore", state: "MD" },
      { city: "Arlington", state: "VA" },
      { city: "Newark", state: "NJ" },
      { city: "Philadelphia", state: "PA" },
      { city: "Brooklyn", state: "NY" },
      { city: "Boston", state: "MA" },
      { city: "Chicago", state: "IL" },
      { city: "Atlanta", state: "GA" },
      { city: "Miami", state: "FL" },
      { city: "Wilmington", state: "DE" },
    ];
    const options = buildResourceLocationOptions(serviceAreas, ["Hampstead, MD, 21074"]);

    for (const st of ["DC", "MD", "VA", "NJ", "PA", "NY", "MA", "IL", "GA", "FL", "DE"]) {
      expect(options.some((o) => o.endsWith(`, ${st}`)), st).toBe(true);
    }
  });

  it("keeps existing resource locations so nothing becomes unfilterable", () => {
    // Real values from public.resources, including the unstructured ones.
    const options = buildResourceLocationOptions(
      [{ city: "Baltimore", state: "MD" }],
      ["Convention Center", "Farm", "Hampstead, MD, 21074", "4234"],
    );
    expect(options).toContain("Convention Center");
    expect(options).toContain("Farm");
    expect(options).toContain("Hampstead, MD, 21074");
    expect(options).toContain("4234");
    expect(options).toContain("Baltimore, MD");
  });

  it("deduplicates case-insensitively, preferring the service-area spelling", () => {
    const options = buildResourceLocationOptions(
      [{ city: "Baltimore", state: "MD" }],
      ["baltimore, md", "BALTIMORE, MD"],
    );
    expect(options.filter((o) => o.toLowerCase() === "baltimore, md")).toEqual(["Baltimore, MD"]);
  });

  it("drops blanks and sorts alphabetically", () => {
    const options = buildResourceLocationOptions(
      [{ city: "Newark", state: "NJ" }],
      ["", "   ", null, undefined, "Atlanta, GA"],
    );
    expect(options).toEqual(["Atlanta, GA", "Newark, NJ"]);
  });

  it("returns an empty list when there is nothing to offer", () => {
    expect(buildResourceLocationOptions([], [])).toEqual([]);
  });
});

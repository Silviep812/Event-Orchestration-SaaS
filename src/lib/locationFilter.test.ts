import { describe, expect, it } from "vitest";
import {
  collectLocationOptions,
  matchesLocationFilter,
} from "@/components/resource-directory/LocationFilterInput";

describe("collectLocationOptions", () => {
  it("offers the combined City, ST label and each component", () => {
    const options = collectLocationOptions([{ city: "Austin", state: "TX", zip: "78701" }]);

    expect(options).toContain("Austin, TX");
    expect(options).toContain("Austin");
    expect(options).toContain("TX");
    expect(options).toContain("78701");
  });

  it("de-duplicates case-insensitively and sorts", () => {
    const options = collectLocationOptions([
      { city: "Austin", state: "TX" },
      { city: "austin", state: "tx" },
    ]);

    expect(options.filter((o) => o.toLowerCase() === "austin")).toHaveLength(1);
    expect([...options].sort((a, b) => a.localeCompare(b))).toEqual(options);
  });

  it("ignores profiles with no location at all", () => {
    expect(collectLocationOptions([{ city: null, state: null, zip: null }, {}])).toEqual([]);
  });

  it("accepts a numeric zip", () => {
    expect(collectLocationOptions([{ zip: 78701 }])).toContain("78701");
  });
});

describe("matchesLocationFilter", () => {
  const profile = { city: "Austin", state: "TX", zip: "78701" };

  it("matches everything when no filter is set", () => {
    expect(matchesLocationFilter(profile, "")).toBe(true);
    expect(matchesLocationFilter(profile, "   ")).toBe(true);
  });

  it("matches a single component, case-insensitively", () => {
    expect(matchesLocationFilter(profile, "austin")).toBe(true);
    expect(matchesLocationFilter(profile, "tx")).toBe(true);
    expect(matchesLocationFilter(profile, "78701")).toBe(true);
  });

  it("matches a combined 'City, ST' selection", () => {
    // The old per-field `includes` check failed here: no single field contains "Austin, TX".
    expect(matchesLocationFilter(profile, "Austin, TX")).toBe(true);
  });

  it("rejects a location the profile does not have", () => {
    expect(matchesLocationFilter(profile, "Dallas")).toBe(false);
    expect(matchesLocationFilter(profile, "Austin, CA")).toBe(false);
  });

  it("handles missing fields without throwing", () => {
    expect(matchesLocationFilter({ city: null, state: null, zip: null }, "austin")).toBe(false);
  });
});

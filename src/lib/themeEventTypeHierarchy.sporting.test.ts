import { describe, expect, it } from "vitest";
import { sportingSelectionTrailLabel, sportingTypeUiLabel } from "@/lib/sportingTypeUiLabel";

describe("sportingTypeUiLabel (V5)", () => {
  it("strips HS/college/pro parenthetical from football/basketball category titles", () => {
    expect(sportingTypeUiLabel("Football games (HS, college & pro)")).toBe("Football games");
    expect(sportingTypeUiLabel("Basketball games (HS, college & pro)")).toBe("Basketball games");
  });

  it("handles 'and' instead of ampersand", () => {
    expect(sportingTypeUiLabel("Football games (HS, college and pro)")).toBe("Football games");
  });

  it("trims dangling punctuation from removed blocks", () => {
    expect(sportingTypeUiLabel("Car races")).toBe("Car races");
  });
});

describe("sportingSelectionTrailLabel", () => {
  it("does not repeat when category and leaf labels match (self-referential DB row)", () => {
    expect(sportingSelectionTrailLabel("Car races", "Car races")).toBe("Car races");
  });

  it("shows category > type when they differ", () => {
    expect(sportingSelectionTrailLabel("Football games", "NFL")).toBe("Football games > NFL");
  });
});

import { describe, expect, it } from "vitest";
import {
  browseThemeBadge,
  isComingSoonBrowseTheme,
  isRecommendedBrowseTheme,
} from "./themeEventTypeHierarchy";

/**
 * Spec: IEP M5_Task 2 V1.3 UI_UX fix(s) 9_24_26.pdf, "Theme category labels":
 *   1) Recommend  = Celebration, Dining and Festival
 *   2) Coming Soon = Retreat, Reunion, Special Events and Wedding
 *   3) All other categories remain unlabeled
 */
describe("browseThemeBadge", () => {
  it("labels the three Recommend themes", () => {
    for (const name of ["Celebration", "Dining", "Festival"]) {
      expect(browseThemeBadge(name), name).toBe("Recommend");
    }
  });

  it("labels the four Coming Soon themes", () => {
    for (const name of ["Retreat", "Reunion", "Special Event", "Wedding"]) {
      expect(browseThemeBadge(name), name).toBe("Coming Soon");
    }
  });

  it("matches the plural spellings the requirement text uses", () => {
    // The catalog stores "Special Event" / "Retreat"; the PDF writes "Special Events".
    expect(browseThemeBadge("Special Events")).toBe("Coming Soon");
    expect(browseThemeBadge("Retreats")).toBe("Coming Soon");
    expect(browseThemeBadge("Reunions")).toBe("Coming Soon");
    expect(browseThemeBadge("Weddings")).toBe("Coming Soon");
  });

  it("leaves every other catalog theme unlabeled", () => {
    for (const name of ["Marketplace", "Meetup", "Health and Wellness", "Sporting"]) {
      expect(browseThemeBadge(name), name).toBeNull();
    }
  });

  it("is case- and whitespace-insensitive, and safe on empty input", () => {
    expect(browseThemeBadge("  cELEBRATION ")).toBe("Recommend");
    expect(browseThemeBadge("  wedding  ")).toBe("Coming Soon");
    expect(browseThemeBadge(null)).toBeNull();
    expect(browseThemeBadge(undefined)).toBeNull();
    expect(browseThemeBadge("   ")).toBeNull();
  });

  it("never classifies a theme as both", () => {
    const catalog = [
      "Celebration", "Dining", "Festival", "Health and Wellness", "Marketplace",
      "Meetup", "Retreat", "Reunion", "Special Event", "Sporting", "Wedding",
    ];
    for (const name of catalog) {
      expect(isRecommendedBrowseTheme(name) && isComingSoonBrowseTheme(name), name).toBe(false);
    }
  });

  it("keeps the existing Festival prefix behaviour", () => {
    expect(browseThemeBadge("Festival Season")).toBe("Recommend");
  });
});

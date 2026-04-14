import { describe, expect, it } from "vitest";
import {
  directoryLinkForResourceCategoryName,
  resourceCategoriesMissingDirectory,
} from "./resourceCategoryDirectory";

describe("resourceCategoryDirectory", () => {
  it("maps seed category names to a directory route", () => {
    expect(directoryLinkForResourceCategoryName("Venue")?.path).toBe("/dashboard/venue");
    expect(directoryLinkForResourceCategoryName("Transportation")?.path).toBe(
      "/dashboard/transportation",
    );
  });

  it("reports missing mappings for unknown names", () => {
    expect(directoryLinkForResourceCategoryName("Custom category")).toBeNull();
    expect(
      resourceCategoriesMissingDirectory([{ id: 0, name: "Custom category" }]),
    ).toEqual(["Custom category"]);
  });

  it("treats empty names as missing", () => {
    expect(resourceCategoriesMissingDirectory([{ id: 1, name: "   " }])).toEqual([
      "(id 1, empty name)",
    ]);
  });
});

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

  it("leaves no live resource_categories row unmapped", () => {
    // Mirrors public.resource_categories in the IEP SaaS Trial project. ids 8 and 9 are
    // stored with a trailing space, so they exercise the padding-tolerant lookup.
    const live = [
      { id: 1, name: "Hospitality" },
      { id: 2, name: "Entertainment" },
      { id: 3, name: "Venue" },
      { id: 4, name: "Transportation" },
      { id: 5, name: "Rentals" },
      { id: 6, name: "Staff" },
      { id: 7, name: "Booking" },
      { id: 8, name: "Supplier " },
      { id: 9, name: "Service " },
      { id: 10, name: "Vendors" },
      { id: 11, name: "Equipment" },
      { id: 12, name: "Supplies" },
      { id: 13, name: "Personnel" },
    ];
    expect(resourceCategoriesMissingDirectory(live)).toEqual([]);
  });

  it("maps the SOW Task 2 resource directory terms", () => {
    for (const term of [
      "Service Rental",
      "Service Vendor",
      "Vendor",
      "Supplier",
      "Transportation",
      "Entertainment",
      "External Vendor",
      "Marketing",
    ]) {
      expect(directoryLinkForResourceCategoryName(term), term).not.toBeNull();
    }
  });
});

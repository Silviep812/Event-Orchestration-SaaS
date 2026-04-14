import { describe, expect, it } from "vitest";
import { formatDirectoryPrice } from "./formatDirectoryPrice";

describe("formatDirectoryPrice", () => {
  it("formats numbers with dollar sign and grouping", () => {
    const s = formatDirectoryPrice(1234.56);
    expect(s).not.toBeNull();
    expect(s!.startsWith("$")).toBe(true);
    expect(s).toContain("234");
  });

  it("returns null for non-finite values", () => {
    expect(formatDirectoryPrice("x")).toBeNull();
    expect(formatDirectoryPrice(NaN)).toBeNull();
    expect(formatDirectoryPrice(null)).toBeNull();
  });
});

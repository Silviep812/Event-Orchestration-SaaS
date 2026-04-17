import { describe, expect, it } from "vitest";
import { rowsToCsv } from "./reportsExport";

describe("rowsToCsv", () => {
  it("escapes quotes", () => {
    const s = rowsToCsv([["a", 'say "hi"']]);
    expect(s).toContain('""');
  });
});

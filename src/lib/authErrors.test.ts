import { describe, expect, it } from "vitest";
import { getAuthErrorDescription } from "./authErrors";

describe("getAuthErrorDescription", () => {
  it("maps confirmation email errors to dashboard guidance", () => {
    const d = getAuthErrorDescription({ message: "Error sending confirmation email" });
    expect(d).toContain("Confirm email");
    expect(d).toContain("supabase.com/docs");
  });

  it("passes through unrelated messages", () => {
    expect(getAuthErrorDescription({ message: "Invalid login credentials" })).toBe(
      "Invalid login credentials",
    );
  });
});

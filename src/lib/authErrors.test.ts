// import { describe, expect, it } from "vitest";
// import { getAuthErrorDescription } from "./authErrors";

// describe("getAuthErrorDescription", () => {
//   it("maps confirmation email errors to dashboard guidance", () => {
//     const d = getAuthErrorDescription({ message: "Error sending confirmation email" });
//     expect(d).toContain("Confirm email");
//     expect(d).toContain("supabase.com/docs");
//   });

//   it("passes through unrelated messages", () => {
//     expect(getAuthErrorDescription({ message: "Invalid login credentials" })).toBe(
//       "Invalid login credentials",
//     );
//   });
// });

import { describe, expect, it } from "vitest";
import { getAuthErrorDescription } from "./authErrors";

describe("getAuthErrorDescription", () => {
  it("maps signup confirmation email errors to a user-friendly signup message", () => {
    const d = getAuthErrorDescription({ message: "Error sending confirmation email" }, "signup");

    expect(d).toBe(
      "We could not send the signup confirmation email right now. Please contact support or try again later.",
    );
  });

  it("maps password reset email errors to a user-friendly reset message", () => {
    const d = getAuthErrorDescription({ message: "Supabase could not send email" }, "password_reset");

    expect(d).toBe("Password reset email could not be sent right now. Please contact support or try again later.");
  });

  it("maps magic link email errors to a user-friendly magic link message", () => {
    const d = getAuthErrorDescription({ message: "Error sending magic link" }, "magic_link");

    expect(d).toBe("Magic link email could not be sent right now. Please contact support or try again later.");
  });

  it("turns the raw invalid-credentials string into an actionable sign-in message", () => {
    expect(getAuthErrorDescription({ message: "Invalid login credentials" }, "signin")).toContain(
      "doesn't match an account",
    );
  });

  it("tells unconfirmed users how to get in", () => {
    const d = getAuthErrorDescription({ message: "Email not confirmed" }, "signin");

    expect(d).toContain("hasn't been confirmed");
    expect(d).toContain("Magic Link");
  });

  it("explains expired reset links", () => {
    expect(getAuthErrorDescription({ message: "Token has expired or is invalid" }, "password_reset")).toContain(
      "same browser",
    );
  });

  it("passes through unrelated messages", () => {
    expect(getAuthErrorDescription({ message: "Something odd happened" }, "signin")).toBe(
      "Something odd happened",
    );
  });

  it("returns a generic fallback message for empty errors", () => {
    expect(getAuthErrorDescription(null)).toBe("Something went wrong. Please try again.");
  });
});

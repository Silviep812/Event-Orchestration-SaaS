import { describe, expect, it } from "vitest";
import {
  commentsPlannerCopy,
  isCommentsDiscussionInfraMissing,
  plannerCommentsToastDescription,
  plannerSafeErrorToastDescription,
} from "./nudges";

describe("plannerCommentsToastDescription", () => {
  it("returns friendly copy when the discussions table is unavailable", () => {
    const err = {
      message:
        "Could not find the table 'public.discussion_comments' in the schema cache — Perhaps you meant …",
    };
    expect(plannerCommentsToastDescription(err, "load")).toBe(commentsPlannerCopy.toastLoadFailed);
    expect(plannerCommentsToastDescription(err, "save")).toBe(commentsPlannerCopy.toastSaveWhileInfra);
  });

  it("detects infra missing from error", () => {
    expect(
      isCommentsDiscussionInfraMissing({
        message: "discussion_comments not in schema cache",
      }),
    ).toBe(true);
  });

  it("passes through short user-relevant messages", () => {
    expect(plannerCommentsToastDescription(new Error("Not allowed"), "save")).toBe("Not allowed");
  });
});

describe("plannerSafeErrorToastDescription", () => {
  it("uses fallback for database-style errors", () => {
    expect(
      plannerSafeErrorToastDescription(
        { message: 'null value in column "foo" violates not-null constraint' },
        "fallback",
      ),
    ).toBe("fallback");
  });

  it("passes through short plain messages", () => {
    expect(plannerSafeErrorToastDescription(new Error("Not allowed"), "fallback")).toBe("Not allowed");
  });
});

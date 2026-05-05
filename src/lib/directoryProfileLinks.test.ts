import { describe, expect, it } from "vitest";
import { directoryProfileUrl } from "./directoryProfileLinks";

describe("directoryProfileUrl", () => {
  it("uses profileId for venue", () => {
    expect(directoryProfileUrl("venue", "abc-123")).toBe("/dashboard/venue?profileId=abc-123");
  });

  it("uses rentalId for service_rental_buy", () => {
    expect(directoryProfileUrl("service_rental_buy", "r1")).toBe(
      "/dashboard/vendor-service?rentalId=r1",
    );
  });
});

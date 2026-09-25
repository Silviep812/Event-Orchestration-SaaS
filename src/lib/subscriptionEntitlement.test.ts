import { describe, expect, it } from "vitest";
import {
  billingActionFor,
  hasProAccess,
  isEntitledStatus,
  subscriptionSummary,
  type SubscriptionSnapshot,
} from "./subscriptionEntitlement";

const NOW = new Date("2026-09-25T12:00:00Z");
const FUTURE = "2026-10-25T12:00:00Z";
const PAST = "2026-08-25T12:00:00Z";

const snap = (over: Partial<SubscriptionSnapshot> = {}): SubscriptionSnapshot => ({
  subscription_plan: "pro",
  subscription_status: "active",
  current_period_end: FUTURE,
  cancel_at_period_end: false,
  ...over,
});

describe("subscriptionEntitlement", () => {
  it("treats active, trialing and past_due as entitled", () => {
    expect(isEntitledStatus("active")).toBe(true);
    expect(isEntitledStatus("trialing")).toBe(true);
    // Deliberate: Stripe retries a failed card for days before giving up.
    expect(isEntitledStatus("past_due")).toBe(true);
    expect(isEntitledStatus("canceled")).toBe(false);
    expect(isEntitledStatus("unpaid")).toBe(false);
    expect(isEntitledStatus("incomplete")).toBe(false);
  });

  it("grants Pro only to a pro plan with an entitled status", () => {
    expect(hasProAccess(snap(), NOW)).toBe(true);
    expect(hasProAccess(snap({ subscription_plan: "starter" }), NOW)).toBe(false);
    expect(hasProAccess(snap({ subscription_status: "canceled" }), NOW)).toBe(false);
  });

  it("revokes Pro once the paid period has lapsed", () => {
    // Guards against a missed customer.subscription.deleted webhook granting Pro forever.
    expect(hasProAccess(snap({ current_period_end: PAST }), NOW)).toBe(false);
  });

  it("does not lock a customer out over an unparseable period end", () => {
    expect(hasProAccess(snap({ current_period_end: "not-a-date" }), NOW)).toBe(true);
  });

  it("handles a missing profile without throwing", () => {
    expect(hasProAccess(null, NOW)).toBe(false);
    expect(hasProAccess(undefined, NOW)).toBe(false);
    expect(billingActionFor(null, NOW)).toBe("upgrade");
    expect(subscriptionSummary(null, NOW)).toBe("Starter (free)");
  });

  it("offers the right billing action", () => {
    expect(billingActionFor(snap(), NOW)).toBe("manage");
    expect(billingActionFor(snap({ cancel_at_period_end: true }), NOW)).toBe("resume");
    expect(billingActionFor(snap({ subscription_plan: "starter" }), NOW)).toBe("upgrade");
    expect(billingActionFor(snap({ current_period_end: PAST }), NOW)).toBe("upgrade");
  });

  it("summarises the states a subscriber can be in", () => {
    expect(subscriptionSummary(snap(), NOW)).toBe("Pro");
    expect(subscriptionSummary(snap({ subscription_status: "trialing" }), NOW)).toBe("Pro — trial");
    expect(subscriptionSummary(snap({ subscription_status: "past_due" }), NOW)).toBe(
      "Pro — payment overdue",
    );
    expect(subscriptionSummary(snap({ cancel_at_period_end: true }), NOW)).toBe(
      "Pro — cancels at period end",
    );
    expect(subscriptionSummary(snap({ subscription_plan: "starter" }), NOW)).toBe("Starter (free)");
  });

  it("matches the live seed state: all profiles are starter/active", () => {
    const live = snap({ subscription_plan: "starter", subscription_status: "active", current_period_end: null });
    expect(hasProAccess(live, NOW)).toBe(false);
    expect(billingActionFor(live, NOW)).toBe("upgrade");
  });
});

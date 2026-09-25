/**
 * Entitlement rules for the Pro plan, shared by the UI and mirrored by the Stripe webhook.
 *
 * Kept as pure functions so the "is this user Pro" decision is testable without a Stripe
 * account, and so the frontend and the webhook cannot drift on what a status means.
 *
 * These decide what the UI *shows*. They are not a security boundary: server-side checks
 * read profiles.subscription_plan, which only the Stripe webhook writes.
 */

export const PRO_PLAN = "pro";
export const STARTER_PLAN = "starter";

/**
 * Stripe subscription statuses that still grant access.
 *
 * `trialing` is entitled because Stripe has accepted the subscription.
 * `past_due` keeps access on purpose: Stripe retries a failed card for days before giving
 * up, and cutting a paying customer off at the first decline is worse than carrying them
 * through a retry. Stripe moves them to `canceled` or `unpaid` when it stops trying.
 */
export const ENTITLED_STATUSES = ["active", "trialing", "past_due"] as const;

export type SubscriptionSnapshot = {
  subscription_plan: string | null;
  subscription_status: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
};

export function isEntitledStatus(status: string | null | undefined): boolean {
  const s = (status ?? "").trim().toLowerCase();
  return (ENTITLED_STATUSES as readonly string[]).includes(s);
}

/**
 * True when the user should see Pro features.
 *
 * `now` is injected rather than read from the clock so expiry behaviour is testable.
 * A lapsed `current_period_end` revokes access even if the plan still reads "pro": a
 * missed `customer.subscription.deleted` webhook must not grant indefinite Pro.
 */
export function hasProAccess(
  profile: SubscriptionSnapshot | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!profile) return false;
  if ((profile.subscription_plan ?? "").trim().toLowerCase() !== PRO_PLAN) return false;
  if (!isEntitledStatus(profile.subscription_status)) return false;

  if (profile.current_period_end) {
    const end = Date.parse(profile.current_period_end);
    // An unparseable date is treated as no expiry rather than as expired, so a bad value
    // cannot silently lock a paying customer out.
    if (!Number.isNaN(end) && end < now.getTime()) return false;
  }
  return true;
}

/** What the billing panel should offer. */
export type BillingAction = "upgrade" | "manage" | "resume" | "none";

export function billingActionFor(
  profile: SubscriptionSnapshot | null | undefined,
  now: Date = new Date(),
): BillingAction {
  if (!profile) return "upgrade";
  if (!hasProAccess(profile, now)) return "upgrade";
  // Still entitled but already cancelled: offer to resume before the period lapses.
  if (profile.cancel_at_period_end) return "resume";
  return "manage";
}

/** Short human status for the billing panel. Never invents a date it does not have. */
export function subscriptionSummary(
  profile: SubscriptionSnapshot | null | undefined,
  now: Date = new Date(),
): string {
  if (!hasProAccess(profile, now)) return "Starter (free)";

  const status = (profile?.subscription_status ?? "").trim().toLowerCase();
  if (status === "trialing") return "Pro — trial";
  if (status === "past_due") return "Pro — payment overdue";
  if (profile?.cancel_at_period_end) return "Pro — cancels at period end";
  return "Pro";
}

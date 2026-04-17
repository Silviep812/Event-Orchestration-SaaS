function stringFromUnknownError(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m.length) {
      const details = (e as { details?: string }).details;
      const hint = (e as { hint?: string }).hint;
      return [m, details, hint].filter((x): x is string => typeof x === "string" && x.length > 0).join(" — ");
    }
  }
  return String(e);
}

/** Detects backend errors where discussions storage is not available yet. */
export function isCommentsDiscussionInfraMissing(e: unknown): boolean {
  const s = stringFromUnknownError(e).toLowerCase();
  return (
    s.includes("discussion_comments") &&
    (s.includes("schema cache") || s.includes("does not exist") || s.includes("could not find"))
  );
}

export const commentsPlannerCopy = {
  schemaMissingTitle: "Team discussions aren’t available yet",
  schemaMissingBody:
    "We’re still connecting this area. Try again in a few minutes. If it keeps happening, contact support.",
  retryButton: "Try again",
  toastLoadFailed: "We couldn’t load discussions. Please try again.",
  toastSaveWhileInfra: "Discussions aren’t fully set up yet. Try again in a little while.",
  toastPostFailed: "We couldn’t post your comment. Please try again.",
  toastReplyFailed: "We couldn’t post your reply. Please try again.",
  toastLikeFailed: "We couldn’t update that. Please try again.",
  toastEditFailed: "We couldn’t save your edit. Please try again.",
  toastDeleteFailed: "We couldn’t remove that comment. Please try again.",
  toastGeneric: "Something went wrong. Please try again.",
  mentionSearchLabel: "Search by name",
  mentionHelper: "Choose someone to mention. They’ll see it in the discussion.",
} as const;

/** Returns a short message for discussion errors; avoids exposing raw system errors when appropriate. */
export function plannerCommentsToastDescription(
  e: unknown,
  context: "load" | "save" = "load",
): string {
  const s = stringFromUnknownError(e);
  if (isCommentsDiscussionInfraMissing(e)) {
    return context === "load" ? commentsPlannerCopy.toastLoadFailed : commentsPlannerCopy.toastSaveWhileInfra;
  }
  if (/schema cache|could not find the table|relation .* does not exist|pgrst/i.test(s)) {
    return context === "load" ? commentsPlannerCopy.toastLoadFailed : commentsPlannerCopy.toastSaveWhileInfra;
  }
  if (s.length > 160) return commentsPlannerCopy.toastGeneric;
  return s;
}

/**
 * Generic toast text for loads/saves. Uses the fallback when the error looks like a system
 * configuration or permission issue rather than a simple validation message.
 */
export function plannerSafeErrorToastDescription(
  e: unknown,
  fallback: string = commentsPlannerCopy.toastGeneric,
): string {
  const s = stringFromUnknownError(e);
  const lower = s.toLowerCase();
  if (
    /schema cache|could not find the table|relation .* does not exist|pgrst|permission denied|violates foreign key|violates check|null value in column|invalid input syntax|duplicate key|not-null constraint|does not exist|42883|42501|42502/i.test(
      lower,
    )
  ) {
    return fallback;
  }
  if (s.length > 180) return fallback;
  return s;
}

export const workflowPlannerCopy = {
  serviceSelectorAlertTitle: "Equipment & service partners",
  serviceSelectorAlertBody:
    "Here you choose equipment rentals and on-site service partners (for example AV or staging). In the next step you’ll pick external vendors for supplies and procurement — that’s a separate list.",
  supplierSelectorHelper:
    "Choose vendors for supplies and procurement. Equipment and rentals from the previous step are separate — you don’t repeat them here.",
  eventThemeEmptyCategory:
    "No event types appear here yet. Try Browse Event Themes, or check back later for more options.",
  eventThemeEmptyRetreatTypes:
    "No retreat types are listed yet. Check back later, or explore other themes while your options are expanded.",
  eventThemeEmptyRetreatBranches:
    "No retreat categories are listed yet. Check back later, or pick another theme to continue planning.",
  transportationSetupTitle: "Transportation list isn’t available yet",
  transportationSetupBody:
    "We’re still connecting this directory. Try again in a few minutes. If it keeps happening, contact support.",
  transportationNoTypesTitle: "No transportation options loaded",
  transportationNoTypesBody:
    "Nothing to show yet. Try refreshing the page. If this stays empty, contact support.",
  transportationProfilesPendingBody:
    "No transportation profiles are available yet. Try again in a few minutes. If this continues, contact support.",
  transportationProfilesLoadFailed:
    "We couldn’t load transportation profiles. Please try again.",
  skipExternalVendorsConfirm:
    "Continue without selecting external vendors? You can add them later from External Vendors in the sidebar, or from your event details.",
} as const;

export const marketingAdminCopy = {
  schemaIncomplete:
    "Marketing metrics aren’t available yet. Refresh this page in a moment, or contact support if this continues.",
  loadFailed: "We couldn’t load marketing data. Please try again.",
  nonAdminBody:
    "This page is for administrators. Subscriber and campaign totals appear here when marketing is enabled for your organization.",
  recentSubscribersEmpty: "No subscribers yet. When people sign up through your forms or imports, they’ll appear here.",
} as const;

export const plannerToolsCopy = {
  analyticsLoadFailed: "We couldn’t load analytics. Please try again.",
  calendarLoadFailed: "We couldn’t load your calendar. Please try again.",
  changeManagementLoadFailed: "We couldn’t load change requests. Please try again.",
  eventsLoadFailed: "We couldn’t load your events. Please try again.",
  syncLocationFailed: "We couldn’t update linked resource locations. Please try again.",
  workflowVendorSaveFailed: "We couldn’t save your vendor list on the event. Please try again.",
  workflowLoadFailed: "We couldn’t load workflow details. Please try again.",
  dashboardLoadFailed: "We couldn’t load your dashboard. Please try again.",
  trackProgressLoadFailed: "We couldn’t load task progress. Please try again.",
  reportsChangeActivityFailed: "We couldn’t load change activity. Please try again.",
  reportsEventPlanFailed: "We couldn’t load your event plan summary. Please try again.",
  taskSelectEventHint:
    "Choose an event with the filter at the top of Project Management, or open Tasks from Manage Event for a specific event.",
  resourceCategoriesDirectoryGap:
    "Some resource categories don’t open a directory yet. Pick another category, or contact support if one you need is missing.",
  sportingTypesUnavailable:
    "Sporting event types aren’t listed here yet. Try again later, choose another theme, or contact support.",
  workflowHwTypesEmpty:
    "No event types were found for this category. Go back and pick another category, or open Browse Event Themes from the sidebar.",
  workflowRetreatTypesEmpty:
    "No event types were found under this category yet. Go back and try another branch, or open Browse Event Themes.",
  workflowRetreatBranchesEmpty:
    "No retreat categories are available yet. Pick another theme to continue, or try Browse Event Themes.",
  workflowThemesUnavailable:
    "No event themes are available right now. Refresh the page or try again later.",
  workflowThemesEmptyHint:
    "Once themes are available, you can pick one here to get started.",
  themeBrowseCategoryTypesEmpty:
    "No types are listed for this category yet. Try another category or check back later.",
  sportingTypesBrowsePending:
    "Sporting event types will show here when they’re available.",
} as const;

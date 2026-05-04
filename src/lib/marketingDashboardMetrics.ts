/** Pure helpers for the admin marketing analytics dashboard (binder KPIs + charts). */

export const MARKETING_KPI_TARGETS = {
  emailOpenRatePct: 35,
  emailClickFromOpenPct: null as number | null,
  demoEngagementPct: 20,
  trialSignupFromSubscriberPctMin: 10,
  trialSignupFromSubscriberPctMax: 15,
  trialToPaidPctMin: 20,
  trialToPaidPctMax: 30,
  vendorSignupTarget: 200,
  vendorBookingRatePct: 15,
} as const;

export type SubscriberSegmentRow = { user_type: string | null; id: string };

export function aggregateSubscriberSegments(rows: SubscriberSegmentRow[]): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const label = (r.user_type ?? "").trim() || "Unspecified";
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export type DeliveryRow = { opened: boolean; clicked: boolean; sent_at: string | null };

export function emailDeliveryRates(deliveries: DeliveryRow[]): {
  sent: number;
  openRatePct: number | null;
  clickRatePct: number | null;
  clickThroughFromOpensPct: number | null;
} {
  const sentRows = deliveries.filter((d) => d.sent_at != null);
  const sent = sentRows.length;
  if (sent === 0) {
    return { sent: 0, openRatePct: null, clickRatePct: null, clickThroughFromOpensPct: null };
  }
  const opens = sentRows.filter((d) => d.opened).length;
  const clicks = sentRows.filter((d) => d.clicked).length;
  return {
    sent,
    openRatePct: Math.round((opens / sent) * 1000) / 10,
    clickRatePct: Math.round((clicks / sent) * 1000) / 10,
    clickThroughFromOpensPct: opens > 0 ? Math.round((clicks / opens) * 1000) / 10 : null,
  };
}

export type CampaignSendAgg = { campaign: string; sends: number; opens: number; clicks: number };

export type DeliveryWithCampaign = {
  opened: boolean;
  clicked: boolean;
  sent_at: string | null;
  marketing_emails?: {
    campaign_id: string | null;
    marketing_campaigns?: { campaign_name: string | null } | null;
  } | null;
};

export function aggregateSendsByCampaign(rows: DeliveryWithCampaign[]): CampaignSendAgg[] {
  const map = new Map<string, { sends: number; opens: number; clicks: number }>();
  for (const r of rows) {
    if (!r.sent_at) continue;
    const name =
      r.marketing_emails?.marketing_campaigns?.campaign_name?.trim() ||
      (r.marketing_emails?.campaign_id ? `Campaign ${r.marketing_emails.campaign_id.slice(0, 8)}…` : "Unassigned campaign");
    const cur = map.get(name) ?? { sends: 0, opens: 0, clicks: 0 };
    cur.sends += 1;
    if (r.opened) cur.opens += 1;
    if (r.clicked) cur.clicks += 1;
    map.set(name, cur);
  }
  return [...map.entries()]
    .map(([campaign, v]) => ({ campaign, ...v }))
    .sort((a, b) => b.sends - a.sends);
}

export function marketingFunnelSeries(input: {
  subscribers: number;
  emailsSent: number;
  opens: number;
  clicks: number;
  conversions: number;
}): { stage: string; value: number }[] {
  return [
    { stage: "Subscribers", value: input.subscribers },
    { stage: "Emails sent", value: input.emailsSent },
    { stage: "Opened", value: input.opens },
    { stage: "Clicked", value: input.clicks },
    { stage: "Conversions", value: input.conversions },
  ];
}

export function pctOf(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return Math.round((part / whole) * 1000) / 10;
}

export type EventVendorFlags = {
  service_vendor_id: string | null;
  service_vendor_ids: string[] | null;
  entertainment_id: string | null;
  external_supplier_ids: string[] | null;
  service_rental_buy_id: string | null;
  venue_booking_completed: boolean | null;
};

export function eventHasVendorBooking(e: EventVendorFlags): boolean {
  if (e.service_vendor_id) return true;
  if (e.service_vendor_ids && e.service_vendor_ids.length > 0) return true;
  if (e.entertainment_id) return true;
  if (e.external_supplier_ids && e.external_supplier_ids.length > 0) return true;
  if (e.service_rental_buy_id) return true;
  return Boolean(e.venue_booking_completed);
}

const DIRECTORY_CATEGORY_ALIASES: Record<string, string> = {
  catering: "Catering",
  caterer: "Catering",
  decor: "Decor",
  decoration: "Decor",
  florist: "Decor",
  photography: "Photography",
  photo: "Photography",
  rental: "Rentals",
  rentals: "Rentals",
  entertainment: "Entertainment",
  av: "Entertainment",
  mixologist: "Entertainment",
};

export function normalizeVendorDirectoryCategory(raw: string | null | undefined): string {
  const s = (raw ?? "").trim();
  if (!s) return "Other";
  const key = s.toLowerCase();
  return DIRECTORY_CATEGORY_ALIASES[key] ?? s;
}

export function rollupVendorCategories(
  rows: { typeName: string | null }[],
): { category: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const cat = normalizeVendorDirectoryCategory(r.typeName);
    map.set(cat, (map.get(cat) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

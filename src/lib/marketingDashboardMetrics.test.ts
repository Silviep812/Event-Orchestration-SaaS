import { describe, expect, it } from "vitest";
import {
  aggregateSendsByCampaign,
  aggregateSubscriberSegments,
  emailDeliveryRates,
  eventHasVendorBooking,
  marketingFunnelSeries,
  pctOf,
  rollupVendorCategories,
} from "./marketingDashboardMetrics";

describe("emailDeliveryRates", () => {
  it("returns null rates when nothing sent", () => {
    expect(emailDeliveryRates([{ opened: false, clicked: false, sent_at: null }])).toEqual({
      sent: 0,
      openRatePct: null,
      clickRatePct: null,
      clickThroughFromOpensPct: null,
    });
  });

  it("computes open and click rates", () => {
    const rows = [
      { opened: true, clicked: false, sent_at: "2026-01-01" },
      { opened: true, clicked: true, sent_at: "2026-01-02" },
      { opened: false, clicked: false, sent_at: "2026-01-03" },
    ];
    expect(emailDeliveryRates(rows)).toEqual({
      sent: 3,
      openRatePct: 66.7,
      clickRatePct: 33.3,
      clickThroughFromOpensPct: 50,
    });
  });
});

describe("aggregateSendsByCampaign", () => {
  it("groups by campaign name", () => {
    const rows = [
      {
        opened: true,
        clicked: false,
        sent_at: "x",
        marketing_emails: {
          campaign_id: "c1",
          marketing_campaigns: { campaign_name: "Launch" },
        },
      },
      {
        opened: false,
        clicked: false,
        sent_at: "y",
        marketing_emails: {
          campaign_id: "c1",
          marketing_campaigns: { campaign_name: "Launch" },
        },
      },
    ];
    expect(aggregateSendsByCampaign(rows)).toEqual([
      { campaign: "Launch", sends: 2, opens: 1, clicks: 0 },
    ]);
  });
});

describe("aggregateSubscriberSegments", () => {
  it("buckets empty user_type as Unspecified", () => {
    expect(
      aggregateSubscriberSegments([
        { id: "1", user_type: null },
        { id: "2", user_type: "  " },
        { id: "3", user_type: "Planner" },
      ]),
    ).toEqual([
      { label: "Unspecified", count: 2 },
      { label: "Planner", count: 1 },
    ]);
  });
});

describe("marketingFunnelSeries", () => {
  it("builds ordered stages", () => {
    expect(
      marketingFunnelSeries({
        subscribers: 100,
        emailsSent: 80,
        opens: 40,
        clicks: 10,
        conversions: 3,
      }),
    ).toEqual([
      { stage: "Subscribers", value: 100 },
      { stage: "Emails sent", value: 80 },
      { stage: "Opened", value: 40 },
      { stage: "Clicked", value: 10 },
      { stage: "Conversions", value: 3 },
    ]);
  });
});

describe("pctOf", () => {
  it("returns null for zero whole", () => {
    expect(pctOf(1, 0)).toBeNull();
  });
});

describe("eventHasVendorBooking", () => {
  it("detects vendor ids", () => {
    expect(
      eventHasVendorBooking({
        service_vendor_id: "x",
        service_vendor_ids: null,
        entertainment_id: null,
        external_supplier_ids: null,
        service_rental_buy_id: null,
        venue_booking_completed: false,
      }),
    ).toBe(true);
  });
});

describe("rollupVendorCategories", () => {
  it("rolls catering aliases", () => {
    expect(
      rollupVendorCategories([{ typeName: "Caterer" }, { typeName: "Photography" }, { typeName: null }]),
    ).toEqual(
      expect.arrayContaining([
        { category: "Catering", count: 1 },
        { category: "Photography", count: 1 },
        { category: "Other", count: 1 },
      ]),
    );
  });
});

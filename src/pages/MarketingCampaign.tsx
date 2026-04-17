import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Megaphone, Users, Mail, Target, TrendingUp, Store, CalendarDays, PieChartIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { marketingAdminCopy } from "@/lib/nudges";
import { useToast } from "@/hooks/use-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  aggregateSendsByCampaign,
  aggregateSubscriberSegments,
  emailDeliveryRates,
  eventHasVendorBooking,
  MARKETING_KPI_TARGETS,
  marketingFunnelSeries,
  pctOf,
  rollupVendorCategories,
  type DeliveryWithCampaign,
  type EventVendorFlags,
} from "@/lib/marketingDashboardMetrics";

type Counts = {
  subscribers: number;
  campaigns: number;
  emailsSent: number;
  openRate: number | null;
  clickRate: number | null;
  conversions: number;
};

type MarketingEmailRow = {
  id: string;
  email_name: string | null;
  subject_line: string | null;
  send_day: number | null;
  template_key: string | null;
  marketing_campaigns?: { campaign_name: string | null } | null;
};

const CHART_COLORS = ["#6366f1", "#22c55e", "#f97316", "#ec4899", "#0ea5e9", "#a855f7", "#eab308"];

export default function MarketingCampaign() {
  const { user, session, userRoles, loading: authLoading } = useAuth();
  const isAdmin = userRoles.includes("admin");
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [recent, setRecent] = useState<
    { id: string; email: string; name: string | null; signup_source: string | null; created_at: string }[]
  >([]);
  const [schemaWarning, setSchemaWarning] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryWithCampaign[]>([]);
  const [segmentCounts, setSegmentCounts] = useState<{ label: string; count: number }[]>([]);
  const [vendorCategoryChart, setVendorCategoryChart] = useState<{ category: string; count: number }[]>([]);
  const [vendorSignupCount, setVendorSignupCount] = useState(0);
  const [eventActivity, setEventActivity] = useState({
    events: 0,
    eventsWithVendor: 0,
    collaboratorAssignments: 0,
    budgetLineItems: 0,
  });
  const [convBreakdown, setConvBreakdown] = useState<{
    trial: number;
    paid: number;
    vendorReg: number;
    other: number;
  }>({ trial: 0, paid: 0, vendorReg: 0, other: 0 });
  const [marketingEmails, setMarketingEmails] = useState<MarketingEmailRow[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string>("");
  const [dispatching, setDispatching] = useState(false);

  const load = useCallback(async () => {
    if (!isAdmin || !user) {
      setLoading(false);
      return;
    }
    setSchemaWarning(null);
    setLoading(true);
    try {
      const missingTable = (err: { message?: string; code?: string } | null) => {
        const m = (err?.message ?? "").toLowerCase();
        return (
          m.includes("schema cache") ||
          m.includes("does not exist") ||
          err?.code === "PGRST205" ||
          err?.code === "42P01"
        );
      };

      const subCount = await supabase.from("marketing_subscribers").select("id", { count: "exact", head: true });
      const campCount = await supabase.from("marketing_campaigns").select("id", { count: "exact", head: true });
      const deliveriesRes = await supabase
        .from("marketing_email_deliveries")
        .select(
          `
          opened, clicked, sent_at,
          marketing_emails (
            campaign_id,
            marketing_campaigns ( campaign_name )
          )
        `,
        )
        .limit(2500);
      const recentRows = await supabase
        .from("marketing_subscribers")
        .select("id, email, name, signup_source, created_at")
        .order("created_at", { ascending: false })
        .limit(12);
      const convCount = await supabase.from("marketing_conversions").select("id", { count: "exact", head: true });
      const convTypes = await supabase.from("marketing_conversions").select("conversion_type").limit(5000);

      const segRows = await supabase.from("marketing_subscribers").select("id, user_type").limit(4000);

      const vendorsRes = await supabase
        .from("serv_vendor_suppliers")
        .select("id, vendor_supplier_types ( name )")
        .limit(6000);

      const eventsRes = await supabase
        .from("events")
        .select("service_vendor_id, service_vendor_ids, entertainment_id, external_supplier_ids, serv_vendor_rental_id, venue_booking_completed")
        .eq("archived", false)
        .limit(8000);

      const budgetCount = await supabase
        .from("budget_items")
        .select("id", { count: "exact", head: true })
        .eq("archived", false);

      const collabCount = await supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .not("event_id", "is", null);

      const emailsList = await supabase
        .from("marketing_emails")
        .select(
          `
          id, email_name, subject_line, send_day, template_key,
          marketing_campaigns ( campaign_name )
        `,
        )
        .order("send_day", { ascending: true, nullsFirst: false });

      const issues: string[] = [];
      if (subCount.error && missingTable(subCount.error)) issues.push("marketing_subscribers");
      if (campCount.error && missingTable(campCount.error)) issues.push("marketing_campaigns");
      if (deliveriesRes.error && missingTable(deliveriesRes.error)) issues.push("marketing_email_deliveries");
      if (recentRows.error && missingTable(recentRows.error)) issues.push("marketing_subscribers (list)");
      if (convCount.error && missingTable(convCount.error)) issues.push("marketing_conversions");

      if (issues.length > 0) {
        setSchemaWarning(marketingAdminCopy.schemaIncomplete);
      }

      const rawDeliveries = (deliveriesRes.data ?? []) as DeliveryWithCampaign[];
      setDeliveries(rawDeliveries);

      const dRows = deliveriesRes.error ? [] : rawDeliveries.filter((d) => d.sent_at);
      const opens = dRows.filter((r) => r.opened).length;
      const clicks = dRows.filter((r) => r.clicked).length;
      const sent = dRows.length;

      setCounts({
        subscribers: subCount.error ? 0 : (subCount.count ?? 0),
        campaigns: campCount.error ? 0 : (campCount.count ?? 0),
        emailsSent: sent,
        openRate: sent > 0 ? Math.round((opens / sent) * 1000) / 10 : null,
        clickRate: sent > 0 ? Math.round((clicks / sent) * 1000) / 10 : null,
        conversions: convCount.error ? 0 : (convCount.count ?? 0),
      });

      const breakdown = { trial: 0, paid: 0, vendorReg: 0, other: 0 };
      if (!convTypes.error && convTypes.data) {
        for (const row of convTypes.data as { conversion_type: string | null }[]) {
          const t = (row.conversion_type ?? "").toLowerCase();
          if (t.includes("trial")) breakdown.trial += 1;
          else if (t.includes("paid") || t.includes("subscription")) breakdown.paid += 1;
          else if (t.includes("vendor")) breakdown.vendorReg += 1;
          else if (t.trim()) breakdown.other += 1;
        }
      }
      setConvBreakdown(breakdown);

      setSegmentCounts(
        segRows.error ? [] : aggregateSubscriberSegments((segRows.data ?? []) as { user_type: string | null; id: string }[]),
      );

      const vRows = (vendorsRes.data ?? []) as { id: string; vendor_supplier_types: { name: string | null } | null }[];
      setVendorSignupCount(vendorsRes.error ? 0 : vRows.length);
      setVendorCategoryChart(
        vendorsRes.error
          ? []
          : rollupVendorCategories(vRows.map((r) => ({ typeName: r.vendor_supplier_types?.name ?? null }))),
      );

      const evRows = (eventsRes.data ?? []) as EventVendorFlags[];
      const withVendor = eventsRes.error ? 0 : evRows.filter(eventHasVendorBooking).length;
      setEventActivity({
        events: eventsRes.error ? 0 : evRows.length,
        eventsWithVendor: withVendor,
        collaboratorAssignments: collabCount.error ? 0 : (collabCount.count ?? 0),
        budgetLineItems: budgetCount.error ? 0 : (budgetCount.count ?? 0),
      });

      const emailData = (emailsList.data ?? []) as MarketingEmailRow[];
      setMarketingEmails(emailsList.error ? [] : emailData);
      setSelectedEmailId((prev) =>
        prev && emailData.some((e) => e.id === prev) ? prev : (emailData[0]?.id ?? ""),
      );

      setRecent(recentRows.error ? [] : ((recentRows.data as typeof recent) ?? []));
    } catch (e: unknown) {
      console.error("MarketingCampaign load:", e);
      setSchemaWarning(marketingAdminCopy.loadFailed);
      setCounts({
        subscribers: 0,
        campaigns: 0,
        emailsSent: 0,
        openRate: null,
        clickRate: null,
        conversions: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, load]);

  const deliveryStats = useMemo(() => emailDeliveryRates(deliveries as { opened: boolean; clicked: boolean; sent_at: string | null }[]), [deliveries]);
  const campaignAgg = useMemo(() => aggregateSendsByCampaign(deliveries), [deliveries]);

  const funnelData = useMemo(() => {
    if (!counts) return [];
    const sentRows = deliveries.filter((d) => d.sent_at);
    const opens = sentRows.filter((d) => d.opened).length;
    const clicks = sentRows.filter((d) => d.clicked).length;
    return marketingFunnelSeries({
      subscribers: counts.subscribers,
      emailsSent: counts.emailsSent,
      opens,
      clicks,
      conversions: counts.conversions,
    });
  }, [counts, deliveries]);

  const vendorBookingRate = useMemo(() => {
    if (eventActivity.events <= 0) return null;
    return pctOf(eventActivity.eventsWithVendor, eventActivity.events);
  }, [eventActivity]);

  const trialSignupRate = useMemo(() => {
    if (!counts || counts.subscribers <= 0) return null;
    return pctOf(convBreakdown.trial, counts.subscribers);
  }, [counts, convBreakdown.trial]);

  const trialToPaidRate = useMemo(() => {
    if (convBreakdown.trial <= 0) return null;
    return pctOf(convBreakdown.paid, convBreakdown.trial);
  }, [convBreakdown]);

  const conversionPieSlices = useMemo(
    () =>
      [
        { name: "Trial", value: convBreakdown.trial },
        { name: "Paid", value: convBreakdown.paid },
        { name: "Vendor", value: convBreakdown.vendorReg },
        { name: "Other", value: convBreakdown.other },
      ].filter((d) => d.value > 0),
    [convBreakdown],
  );

  const handleDispatch = async () => {
    if (!selectedEmailId || !session?.access_token) {
      toast({ variant: "destructive", title: "Choose an email template", description: "Select a campaign email first." });
      return;
    }
    setDispatching(true);
    const { data, error } = await supabase.functions.invoke("marketing-dispatch-campaign", {
      body: { marketing_email_id: selectedEmailId },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setDispatching(false);
    if (error) {
      toast({
        variant: "destructive",
        title: "Dispatch failed",
        description: error.message ?? "Edge function error",
      });
      return;
    }
    const body = data as { ok?: boolean; sent?: number; attempted?: number; errors?: string[]; message?: string };
    if (!body?.ok) {
      toast({
        variant: "destructive",
        title: "Dispatch rejected",
        description: (body as { error?: string }).error ?? "Unknown error",
      });
      return;
    }
    toast({
      title: "Campaign send complete",
      description: `Queued Resend for ${body.sent ?? 0} of ${body.attempted ?? 0} subscribers.`,
    });
    if (body.errors?.length) {
      toast({
        variant: "destructive",
        title: "Some recipients failed",
        description: body.errors.slice(0, 3).join(" · "),
      });
    }
    void load();
  };

  if (authLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-lg py-12 text-center text-muted-foreground">
        Sign in to view marketing tools.
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-lg py-12 space-y-4">
        <div className="flex items-center gap-2 text-lg font-medium">
          <Megaphone className="h-5 w-5" />
          Marketing campaign dashboard
        </div>
        <p className="text-muted-foreground">{marketingAdminCopy.nonAdminBody}</p>
      </div>
    );
  }

  const openTargetProgress =
    counts?.openRate != null ? Math.min(100, (counts.openRate / MARKETING_KPI_TARGETS.emailOpenRatePct) * 100) : 0;
  const vendorTargetProgress = Math.min(100, (vendorSignupCount / MARKETING_KPI_TARGETS.vendorSignupTarget) * 100);
  const bookingTargetProgress =
    vendorBookingRate != null
      ? Math.min(100, (vendorBookingRate / MARKETING_KPI_TARGETS.vendorBookingRatePct) * 100)
      : 0;

  return (
    <div className="container max-w-6xl py-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            Marketing analytics
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Campaign binder view: subscribers, email performance, audience mix, marketplace signals, and workspace
            activity. KPI targets are shown for launch tracking.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to="/marketing-creatives" target="_blank" rel="noreferrer">
            Open social ad previews
          </Link>
        </Button>
      </div>

      {schemaWarning ? (
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {schemaWarning}
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : counts ? (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="email">Email performance</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="activity">Event activity</TabsTrigger>
            <TabsTrigger value="dispatch">Resend dispatch</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total subscribers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{counts.subscribers}</div>
                  <p className="text-xs text-muted-foreground">Waitlist + campaign audience</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active campaigns</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{counts.campaigns}</div>
                  <p className="text-xs text-muted-foreground">Rows in campaign planner</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Emails sent (logged)</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{counts.emailsSent}</div>
                  <p className="text-xs text-muted-foreground">Delivery rows with a send time</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Open rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{counts.openRate != null ? `${counts.openRate}%` : "—"}</div>
                  <p className="text-xs text-muted-foreground">Target {MARKETING_KPI_TARGETS.emailOpenRatePct}%</p>
                  {counts.openRate != null ? <Progress value={openTargetProgress} className="mt-2 h-2" /> : null}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Click rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{counts.clickRate != null ? `${counts.clickRate}%` : "—"}</div>
                  <p className="text-xs text-muted-foreground">Clicks ÷ sends (logged)</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{counts.conversions}</div>
                  <p className="text-xs text-muted-foreground">
                    Trial {convBreakdown.trial} · Paid {convBreakdown.paid} · Vendor {convBreakdown.vendorReg}
                    {convBreakdown.other ? ` · Other ${convBreakdown.other}` : ""}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Binder KPIs (progress)</CardTitle>
                  <CardDescription>Compare live metrics to launch targets from the campaign playbook.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Trial signup rate (trials ÷ subscribers)</span>
                      <span className="text-muted-foreground">
                        {trialSignupRate != null ? `${trialSignupRate}%` : "—"} · target{" "}
                        {MARKETING_KPI_TARGETS.trialSignupFromSubscriberPctMin}–
                        {MARKETING_KPI_TARGETS.trialSignupFromSubscriberPctMax}%
                      </span>
                    </div>
                    <Progress
                      value={
                        trialSignupRate != null
                          ? Math.min(
                              100,
                              (trialSignupRate / MARKETING_KPI_TARGETS.trialSignupFromSubscriberPctMax) * 100,
                            )
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Trial → paid</span>
                      <span className="text-muted-foreground">
                        {trialToPaidRate != null ? `${trialToPaidRate}%` : "—"} · target{" "}
                        {MARKETING_KPI_TARGETS.trialToPaidPctMin}–{MARKETING_KPI_TARGETS.trialToPaidPctMax}%
                      </span>
                    </div>
                    <Progress
                      value={
                        trialToPaidRate != null
                          ? Math.min(100, (trialToPaidRate / MARKETING_KPI_TARGETS.trialToPaidPctMax) * 100)
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Vendor signups (directory)</span>
                      <span className="text-muted-foreground">
                        {vendorSignupCount} · target {MARKETING_KPI_TARGETS.vendorSignupTarget}
                      </span>
                    </div>
                    <Progress value={vendorTargetProgress} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Vendor booking rate (events w/ vendor signals)</span>
                      <span className="text-muted-foreground">
                        {vendorBookingRate != null ? `${vendorBookingRate}%` : "—"} · target{" "}
                        {MARKETING_KPI_TARGETS.vendorBookingRatePct}%
                      </span>
                    </div>
                    <Progress value={bookingTargetProgress} className="h-2" />
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    Demo engagement target {MARKETING_KPI_TARGETS.demoEngagementPct}% is tracked outside the database
                    (product analytics / video host). Wire your demo tool to post into{" "}
                    <code className="text-xs">marketing_conversions</code> if you want it here.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Email funnel</CardTitle>
                  <CardDescription>Subscribers through sends, engagement, and attributed conversions.</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="stage" width={110} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {funnelData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Open rate (deliveries)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {deliveryStats.openRatePct != null ? `${deliveryStats.openRatePct}%` : "—"}
                  </div>
                  <p className="text-xs text-muted-foreground">Opens ÷ sends with logged delivery</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Click rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {deliveryStats.clickRatePct != null ? `${deliveryStats.clickRatePct}%` : "—"}
                  </div>
                  <p className="text-xs text-muted-foreground">Clicks ÷ sends</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Click-through (of opens)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {deliveryStats.clickThroughFromOpensPct != null ? `${deliveryStats.clickThroughFromOpensPct}%` : "—"}
                  </div>
                  <p className="text-xs text-muted-foreground">Clicks ÷ opens</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campaign performance</CardTitle>
                <CardDescription>Sends, opens, and clicks grouped by campaign name on each delivery.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {campaignAgg.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No delivery data yet — run a dispatch from the Resend tab.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={campaignAgg} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="campaign" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={56} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="sends" fill="#6366f1" name="Sends" />
                      <Bar dataKey="opens" fill="#22c55e" name="Opens" />
                      <Bar dataKey="clicks" fill="#f97316" name="Clicks" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conversion mix</CardTitle>
                <CardDescription>Heuristic grouping from `conversion_type` text.</CardDescription>
              </CardHeader>
              <CardContent className="h-[260px]">
                {conversionPieSlices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No conversion rows yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={conversionPieSlices}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={88}
                        label
                      >
                        {conversionPieSlices.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="segments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Subscribers by audience</CardTitle>
                <CardDescription>Uses `user_type` captured on the landing waitlist form.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                {segmentCounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No segmented subscribers yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={segmentCounts} margin={{ left: 8, right: 8, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-16} textAnchor="end" height={64} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0ea5e9" name="Subscribers" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Vendor signups</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{vendorSignupCount}</div>
                  <p className="text-sm text-muted-foreground mt-1">Rows in `serv_vendor_suppliers` (service vendor directory).</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Vendor bookings (proxy)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{vendorBookingRate != null ? `${vendorBookingRate}%` : "—"}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Share of non-archived events with at least one vendor / supplier / venue-booked signal.
                  </p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Category distribution</CardTitle>
                <CardDescription>
                  Supplier type names rolled up toward Catering · Decor · Photography · Rentals · Entertainment (remainder
                  stays as labeled).
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {vendorCategoryChart.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No vendor directory rows.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vendorCategoryChart}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {vendorCategoryChart.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Events created</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{eventActivity.events}</div>
                  <p className="text-xs text-muted-foreground">Non-archived (sample cap 8000)</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Collaborators on events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{eventActivity.collaboratorAssignments}</div>
                  <p className="text-xs text-muted-foreground">`user_roles` rows with an event_id</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Events w/ vendor signal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{eventActivity.eventsWithVendor}</div>
                  <p className="text-xs text-muted-foreground">Booked or linked resources</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Budget line items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{eventActivity.budgetLineItems}</div>
                  <p className="text-xs text-muted-foreground">Non-archived budget rows</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity snapshot</CardTitle>
                <CardDescription>Events, vendor-linked events, and budget lines currently visible to admins.</CardDescription>
              </CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { label: "Events", value: eventActivity.events },
                      { label: "With vendor", value: eventActivity.eventsWithVendor },
                      { label: "Budget lines", value: eventActivity.budgetLineItems },
                    ]}
                    margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dispatch" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resend — send campaign email</CardTitle>
                <CardDescription>
                  Uses the `marketing-dispatch-campaign` Edge Function: Resend sends HTML, then a delivery row is logged for
                  analytics. Requires <code className="text-xs">RESEND_API_KEY</code> and deployed function.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-xl">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Template</label>
                  <Select value={selectedEmailId || undefined} onValueChange={setSelectedEmailId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select marketing_emails row" />
                    </SelectTrigger>
                    <SelectContent>
                      {marketingEmails.map((e) => {
                        const camp = e.marketing_campaigns?.campaign_name ?? "Campaign";
                        const label = `${camp} — ${e.email_name ?? e.subject_line ?? e.id.slice(0, 8)}`;
                        return (
                          <SelectItem key={e.id} value={e.id}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => void handleDispatch()} disabled={dispatching || !marketingEmails.length}>
                  {dispatching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send to all subscribers"
                  )}
                </Button>
                {!marketingEmails.length ? (
                  <p className="text-sm text-muted-foreground">
                    Add rows to <code className="text-xs">marketing_campaigns</code> and{" "}
                    <code className="text-xs">marketing_emails</code> (SQL or admin tooling) to enable sends.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent subscribers</CardTitle>
          <CardDescription>Latest sign-ups — “Source” shows landing or campaign attribution when present.</CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">{marketingAdminCopy.recentSubscribersEmpty}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm">{r.email}</TableCell>
                    <TableCell>{r.name ?? "—"}</TableCell>
                    <TableCell>{r.signup_source ?? "—"}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

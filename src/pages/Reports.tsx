import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FileText,
  Download,
  Filter,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Activity,
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getLifecycleTableBadge } from "@/lib/eventStatus";
import { plannerSafeErrorToastDescription, plannerToolsCopy } from "@/lib/nudges";
import { downloadCsv, downloadAnalyticsReportsPdf } from "@/lib/reportsExport";
import { ReportsInsightsTab } from "@/components/reports/ReportsInsightsTab";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/*
 * Change log data: prefers view activity_feed, falls back to cm_activity. Not shown in UI.
 */

interface ChangeLog {
  id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  event_id: string | null;
  metadata: Record<string, unknown> | null;
  changed_by: string | null;
  created_at: string;
}

interface ReportData {
  totalChanges: number;
  changesByType: { name: string; value: number; color: string }[];
  changesByDate: { date: string; changes: number }[];
  topModifiedEntities: { entity: string; changes: number }[];
  userActivity: { user: string; changes: number }[];
}

interface EventPlanRow {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  venue: string | null;
  location: string | null;
  /** Primary label for multi-location reporting (location or venue). */
  locationLabel: string;
  budget: number | null;
  /** Sum of budget_items.actual_cost (non-archived) for this event. */
  budgetActualSpend: number | null;
  /** Planned budget minus recorded actual spend when both exist. */
  budgetVariance: number | null;
  expected_attendees: number | null;
  themeName: string;
  /** Completed tasks (status = completed). */
  tasksDone: number;
  /** All tasks including cancelled. */
  tasksTotal: number;
  /** Tasks excluding cancelled (denominator for completion rate). */
  tasksActive: number;
  /** 0–100; null when there are no active tasks. */
  taskCompletionRate: number | null;
  updated_at: string | null;
}

const Reports = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  /** Change-log / analytics data only — do not block the Event Plan tab. */
  const [changeLogsLoading, setChangeLogsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dueSoonCount, setDueSoonCount] = useState<number | null>(null);
  const [vendorCategoryRows, setVendorCategoryRows] = useState<number | null>(null);
  const [eventPlanRows, setEventPlanRows] = useState<EventPlanRow[]>([]);
  const [eventPlanLoading, setEventPlanLoading] = useState(false);
  const [canAccessEventPlan, setCanAccessEventPlan] = useState(false);
  /** After true, `canAccessEventPlan` reflects the owner check (avoids redirecting owners off ?tab=event-plan before fetch completes). */
  const [eventPlanOwnerReady, setEventPlanOwnerReady] = useState(false);
  const [vendorSelectionRows, setVendorSelectionRows] = useState<
    { selection_type: string; selection_count: number }[]
  >([]);
  const [vendorSpendByVendor, setVendorSpendByVendor] = useState<{ vendor: string; actual: number }[]>([]);
  const [pdfExporting, setPdfExporting] = useState(false);
  const { toast } = useToast();

  const tabFromUrl = searchParams.get("tab");
  const urlToPanel = (p: string | null): string => {
    if (p === "change-requests") return "change-requests";
    if (p === "analytics") return "analytics";
    if (p === "detailed") return "detailed";
    if (p === "trends") return "trends";
    if (p === "insights") return "insights";
    return "overview";
  };
  const panelToUrl = (panel: string): string => {
    if (panel === "overview") return "event-plan";
    return panel;
  };

  const [activeTab, setActiveTab] = useState(() => urlToPanel(tabFromUrl));
  useEffect(() => {
    setActiveTab(urlToPanel(searchParams.get("tab")));
  }, [searchParams]);

  const changeRequestLogs = changeLogs.filter((l) => {
    const meta = l.metadata ? JSON.stringify(l.metadata).toLowerCase() : "";
    return (
      /change.?request/i.test(l.entity_type || "") ||
      /change.?request/i.test(l.action || "") ||
      meta.includes("change request")
    );
  });

  const onReportTabChange = (v: string) => {
    setActiveTab(v);
    setSearchParams({ tab: panelToUrl(v) }, { replace: true });
  };

  useEffect(() => {
    fetchChangeData();
  }, [dateRange, entityTypeFilter, actionFilter]);

  useEffect(() => {
    (async () => {
      const { count, error: e1 } = await supabase
        .from("due_soon_events")
        .select("*", { count: "exact", head: true });
      if (!e1) setDueSoonCount(count ?? 0);
      const { data: vc, error: e2 } = await supabase.from("vendor_category_counts").select("event_id");
      if (!e2) setVendorCategoryRows(vc?.length ?? 0);
    })();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setEventPlanRows([]);
      setCanAccessEventPlan(false);
      setEventPlanOwnerReady(true);
      return;
    }
    let cancelled = false;
    setEventPlanOwnerReady(false);
    (async () => {
      setEventPlanLoading(true);
      try {
        const { data: ownedEvs, error: evErr } = await supabase
          .from("events")
          .select(
            "id, title, start_date, end_date, status, venue, location, budget, expected_attendees, theme_id, updated_at, archived",
          )
          .eq("user_id", user.id)
          .eq("archived", false)
          .order("start_date", { ascending: true });
        if (evErr) throw evErr;

        const owned = ownedEvs || [];
        if (!cancelled) setCanAccessEventPlan(owned.length > 0);
        const list = [...owned].sort((a, b) => {
          const ad = a.start_date || "";
          const bd = b.start_date || "";
          return ad.localeCompare(bd);
        });
        const themeIds = [...new Set(list.map((e) => e.theme_id).filter((x): x is number => x != null))];
        let themeMap: Record<number, string> = {};
        if (themeIds.length > 0) {
          const { data: th } = await supabase.from("Themes Directory Catalog").select("id, name").in("id", themeIds);
          themeMap = Object.fromEntries((th || []).map((t) => [t.id, t.name || ""]));
        }
        const eventIds = list.map((e) => e.id);
        let taskByEvent: Record<string, { total: number; completed: number; cancelled: number }> = {};
        if (eventIds.length > 0) {
          const { data: tasks } = await supabase
            .from("tasks")
            .select("event_id, status")
            .in("event_id", eventIds);
          for (const id of eventIds) {
            taskByEvent[id] = { total: 0, completed: 0, cancelled: 0 };
          }
          for (const t of tasks || []) {
            const eid = t.event_id as string;
            if (!eid || !taskByEvent[eid]) continue;
            taskByEvent[eid].total += 1;
            if (t.status === "completed") taskByEvent[eid].completed += 1;
            if (t.status === "cancelled") taskByEvent[eid].cancelled += 1;
          }
        }

        const spendByEvent: Record<string, number> = {};
        if (eventIds.length > 0) {
          const { data: biRows, error: biErr } = await supabase
            .from("budget_items")
            .select("event_id, actual_cost, archived")
            .in("event_id", eventIds);
          if (biErr) console.warn("budget_items (reports):", biErr);
          for (const row of biRows || []) {
            if (row.archived) continue;
            const eid = row.event_id as string;
            const act = Number(row.actual_cost) || 0;
            spendByEvent[eid] = (spendByEvent[eid] || 0) + act;
          }
        }

        const vendorSpendMap = new Map<string, number>();
        if (eventIds.length > 0) {
          const { data: biV, error: biVErr } = await supabase
            .from("budget_items")
            .select("vendor_name, actual_cost, archived")
            .in("event_id", eventIds);
          if (biVErr) console.warn("budget_items vendors:", biVErr);
          for (const row of biV || []) {
            if (row.archived) continue;
            const name = (row.vendor_name || "").trim();
            if (!name) continue;
            const act = Number(row.actual_cost) || 0;
            if (!act) continue;
            vendorSpendMap.set(name, (vendorSpendMap.get(name) || 0) + act);
          }
          const vendorSpendArr = [...vendorSpendMap.entries()]
            .map(([vendor, actual]) => ({ vendor, actual }))
            .sort((a, b) => b.actual - a.actual)
            .slice(0, 12);
          if (!cancelled) setVendorSpendByVendor(vendorSpendArr);
        }

        if (eventIds.length > 0) {
          const { data: vcc, error: vccErr } = await supabase
            .from("vendor_category_counts")
            .select("selection_type, selection_count")
            .in("event_id", eventIds);
          if (vccErr) {
            console.warn("vendor_category_counts:", vccErr);
            if (!cancelled) setVendorSelectionRows([]);
          } else {
            const agg = new Map<string, number>();
            for (const r of vcc || []) {
              const k = (r.selection_type as string) || "unknown";
              const n = Number(r.selection_count) || 0;
              agg.set(k, (agg.get(k) || 0) + n);
            }
            if (!cancelled) {
              setVendorSelectionRows(
                [...agg.entries()].map(([selection_type, selection_count]) => ({ selection_type, selection_count })),
              );
            }
          }
        } else if (!cancelled) {
          setVendorSelectionRows([]);
          setVendorSpendByVendor([]);
        }

        const locationLabel = (venue: string | null, location: string | null) => {
          const loc = (location || "").trim();
          const ven = (venue || "").trim();
          if (loc) return loc;
          if (ven) return ven;
          return "Unknown";
        };

        const rows: EventPlanRow[] = list.map((e) => {
          const tid = e.theme_id ?? undefined;
          const tstat = e.id ? taskByEvent[e.id] : { total: 0, completed: 0, cancelled: 0 };
          const active = tstat.total - tstat.cancelled;
          const rate = active > 0 ? (tstat.completed / active) * 100 : null;
          const actualSpend = e.id ? spendByEvent[e.id] ?? null : null;
          const plan = e.budget != null ? Number(e.budget) : null;
          const variance = plan != null && actualSpend != null ? plan - actualSpend : null;
          const loc = locationLabel(e.venue, e.location);
          return {
            id: e.id,
            title: e.title,
            start_date: e.start_date,
            end_date: e.end_date,
            status: e.status,
            venue: e.venue,
            location: e.location ?? null,
            locationLabel: loc,
            budget: e.budget,
            budgetActualSpend: actualSpend,
            budgetVariance: variance,
            expected_attendees: e.expected_attendees,
            themeName: tid != null ? themeMap[tid] || "—" : "—",
            tasksDone: tstat.completed,
            tasksTotal: tstat.total,
            tasksActive: active,
            taskCompletionRate: rate,
            updated_at: e.updated_at,
          };
        });
        if (!cancelled) setEventPlanRows(rows);
      } catch (e: unknown) {
        console.error(e);
        if (!cancelled) {
          setCanAccessEventPlan(false);
          setEventPlanRows([]);
          toast({
            title: "Error",
            description: plannerSafeErrorToastDescription(e, plannerToolsCopy.reportsEventPlanFailed),
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) {
          setEventPlanLoading(false);
          setEventPlanOwnerReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!eventPlanOwnerReady) return;
    if (!canAccessEventPlan && activeTab === "overview") {
      onReportTabChange("insights");
    }
  }, [activeTab, canAccessEventPlan, eventPlanOwnerReady]);

  const [userDisplayNames, setUserDisplayNames] = useState<Record<string, string>>({});
  useEffect(() => {
    const fetchUserNames = async () => {
      const userIds = Array.from(new Set(changeLogs.map(log => log.changed_by).filter(Boolean))) as string[];
      if (userIds.length === 0) return;
      const { data } = await supabase
        .from('user_profiles_teammate_view')
        .select('user_id, display_name')
        .in('user_id', userIds);
      const nameMap: Record<string, string> = {};
      (data || []).forEach(profile => {
        nameMap[profile.user_id] = profile.display_name || profile.user_id.substring(0, 8) + '...';
      });
      setUserDisplayNames(nameMap);
    };
    fetchUserNames();
  }, [changeLogs]);

  const mapActivityRowToChangeLog = (row: Record<string, unknown>): ChangeLog | null => {
    const id = row.id;
    const entity_type = row.entity_type;
    const action = row.action;
    const created_at = row.created_at;
    if (typeof id !== "string" || typeof entity_type !== "string" || typeof action !== "string" || typeof created_at !== "string") {
      return null;
    }
    return {
      id,
      entity_type,
      entity_id: typeof row.entity_id === "string" ? row.entity_id : null,
      action,
      event_id: typeof row.event_id === "string" ? row.event_id : null,
      metadata: row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : null,
      changed_by: typeof row.changed_by === "string" ? row.changed_by : null,
      created_at,
    };
  };

  const fetchChangeData = async () => {
    try {
      setChangeLogsLoading(true);

      const runQuery = (source: string) => {
        let query = (supabase.from as any)(source).select("*").order("created_at", { ascending: false });
        if (dateRange?.from) {
          query = query.gte("created_at", dateRange.from.toISOString());
        }
        if (dateRange?.to) {
          query = query.lte("created_at", dateRange.to.toISOString());
        }
        if (entityTypeFilter !== "all") {
          query = query.eq("entity_type", entityTypeFilter);
        }
        if (actionFilter !== "all") {
          query = query.eq("action", actionFilter);
        }
        return query;
      };

      let { data, error } = await runQuery("activity_feed");
      if (error) {
        const retry = await runQuery("cm_activity");
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;

      const logs = (data || [])
        .map((row) => mapActivityRowToChangeLog(row as Record<string, unknown>))
        .filter((log): log is ChangeLog => log !== null);
      setChangeLogs(logs);
      generateReportData(logs);
    } catch (error: unknown) {
      console.error("Error fetching change data:", error);
      toast({
        title: "Error",
        description: plannerSafeErrorToastDescription(error, plannerToolsCopy.reportsChangeActivityFailed),
        variant: "destructive",
      });
      setChangeLogs([]);
      setReportData(null);
    } finally {
      setChangeLogsLoading(false);
    }
  };

  const generateReportData = (logs: ChangeLog[]) => {
    // Changes by type
    const typeCount: { [key: string]: number } = {};
    logs.forEach(log => {
      typeCount[log.entity_type] = (typeCount[log.entity_type] || 0) + 1;
    });

    const changesByType = Object.entries(typeCount).map(([name, value], index) => ({
      name: name.replace('_', ' ').toUpperCase(),
      value,
      color: `hsl(${index * 45}, 70%, 50%)`,
    }));

    // Changes by date (last 30 days)
    const dateCount: { [key: string]: number } = {};
    logs.forEach(log => {
      const date = format(new Date(log.created_at), 'MMM dd');
      dateCount[date] = (dateCount[date] || 0) + 1;
    });

    const changesByDate = Object.entries(dateCount)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, changes]) => ({ date, changes }));

    // Top modified entities (group by entity type)
    const entityTypeCount: { [key: string]: number } = {};
    logs.forEach(log => {
      entityTypeCount[log.entity_type] = (entityTypeCount[log.entity_type] || 0) + 1;
    });
    const topModifiedEntities = Object.entries(entityTypeCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([entity, changes]) => ({ entity: entity.replace('_', ' ').toUpperCase(), changes }));

    // User activity
    const userCount: { [key: string]: number } = {};
    logs.forEach(log => {
      if (!log.changed_by) return;
      userCount[log.changed_by] = (userCount[log.changed_by] || 0) + 1;
    });

    const userActivity = Object.entries(userCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([user, changes]) => ({
        user, // always store user id here
        changes
      }));

    setReportData({
      totalChanges: logs.length,
      changesByType,
      changesByDate,
      topModifiedEntities,
      userActivity,
    });
  };

  const locationPerformanceMemo = useMemo(() => {
    const m = new Map<string, { events: number; sumRate: number; nRate: number }>();
    for (const r of eventPlanRows) {
      const L = r.locationLabel;
      const cur = m.get(L) || { events: 0, sumRate: 0, nRate: 0 };
      cur.events += 1;
      if (r.taskCompletionRate != null) {
        cur.sumRate += r.taskCompletionRate;
        cur.nRate += 1;
      }
      m.set(L, cur);
    }
    return [...m.entries()]
      .map(([location, v]) => ({
        location,
        events: v.events,
        avgCompletion: v.nRate ? v.sumRate / v.nRate : null,
      }))
      .sort((a, b) => b.events - a.events);
  }, [eventPlanRows]);

  const insightsProps = useMemo(() => {
    const budgetVsActual = eventPlanRows.map((r) => ({
      name: r.title,
      budget: Number(r.budget) || 0,
      actual: Number(r.budgetActualSpend) || 0,
    }));
    const taskCompletionRates = eventPlanRows
      .filter((r) => r.tasksActive > 0 && r.taskCompletionRate != null)
      .map((r) => ({ name: r.title, rate: r.taskCompletionRate! }));
    const vendorSelectionsByCategory = vendorSelectionRows.map((r) => ({
      name: r.selection_type,
      selections: r.selection_count,
    }));
    return {
      budgetVsActual,
      taskCompletionRates,
      vendorSelectionsByCategory,
      vendorSpendTop: vendorSpendByVendor,
      locationPerformance: locationPerformanceMemo,
      changeFrequency: reportData?.changesByDate || [],
    };
  }, [eventPlanRows, vendorSelectionRows, vendorSpendByVendor, locationPerformanceMemo, reportData]);

  const exportChangeLogsCsv = () => {
    downloadCsv(`activity-feed-${format(new Date(), "yyyy-MM-dd")}.csv`, [
      ["Date", "Entity Type", "Action", "Event ID", "Entity ID", "Metadata", "User ID"],
      ...changeLogs.map((log) => [
        format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
        log.entity_type,
        log.action,
        log.event_id || "",
        log.entity_id || "",
        log.metadata ? JSON.stringify(log.metadata) : "",
        log.changed_by || "",
      ]),
    ]);
    toast({
      title: "Exported",
      description: "Activity feed CSV downloaded (same rows as the filters above; activity_feed / cm_activity).",
    });
  };

  const exportUnifiedAuditEventsCsv = async () => {
    try {
      let query = supabase
        .from("unified_audit_events")
        .select("id, created_at, event_id, entity_type, entity_id, action, changed_by, metadata")
        .order("created_at", { ascending: false })
        .limit(10000);
      if (dateRange?.from) {
        query = query.gte("created_at", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte("created_at", dateRange.to.toISOString());
      }
      if (entityTypeFilter !== "all") {
        query = query.eq("entity_type", entityTypeFilter);
      }
      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      const rows = data || [];
      downloadCsv(`unified-audit-events-${format(new Date(), "yyyy-MM-dd")}.csv`, [
        ["Date", "Entity Type", "Action", "Event ID", "Entity ID", "Metadata", "User ID"],
        ...rows.map((log) => [
          log.created_at ? format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss") : "",
          log.entity_type ?? "",
          log.action ?? "",
          log.event_id || "",
          log.entity_id || "",
          log.metadata ? JSON.stringify(log.metadata) : "",
          log.changed_by || "",
        ]),
      ]);
      toast({
        title: "Exported",
        description: "Unified audit view CSV downloaded (unified_audit_events; same column layout as activity export).",
      });
    } catch (e: unknown) {
      console.error(e);
      toast({
        title: "Export failed",
        description: plannerSafeErrorToastDescription(e, plannerToolsCopy.reportsChangeActivityFailed),
        variant: "destructive",
      });
    }
  };

  const exportEventPlanCsv = () => {
    if (!canAccessEventPlan || !eventPlanOwnerReady) {
      toast({
        title: "Not available",
        description:
          "The Event Plan export is only for event owners with at least one active (non-archived) event.",
        variant: "destructive",
      });
      return;
    }
    if (eventPlanRows.length === 0) {
      toast({
        title: "Nothing to export",
        description: "Create an active event first, then export your event plan.",
        variant: "destructive",
      });
      return;
    }
    downloadCsv(`event-plan-${format(new Date(), "yyyy-MM-dd")}.csv`, [
      [
        "Event",
        "Primary location",
        "Start date",
        "Theme",
        "Budget (plan)",
        "Actual spend",
        "Variance",
        "Tasks completed",
        "Tasks active",
        "Completion %",
      ],
      ...eventPlanRows.map((r) => [
        r.title,
        r.locationLabel,
        r.start_date || "",
        r.themeName,
        r.budget ?? "",
        r.budgetActualSpend ?? "",
        r.budgetVariance ?? "",
        r.tasksDone,
        r.tasksActive,
        r.taskCompletionRate != null ? `${r.taskCompletionRate.toFixed(1)}%` : "",
      ]),
    ]);
    toast({ title: "Exported", description: "Event plan CSV downloaded." });
  };

  const exportAnalyticsSummaryCsv = () => {
    const date = format(new Date(), "yyyy-MM-dd");
    const timeline = reportData?.changesByDate || [];
    const topEnt = reportData?.topModifiedEntities || [];
    downloadCsv(`analytics-summary-${date}.csv`, [
      ["Section", "Key", "Value"],
      ...timeline.map((r) => ["Change frequency (by day)", r.date, r.changes]),
      ...topEnt.map((r) => ["Top modified entities", r.entity, r.changes]),
    ]);
    toast({ title: "Exported", description: "Analytics summary CSV downloaded." });
  };

  const exportFullPdfPack = async () => {
    setPdfExporting(true);
    try {
      const slug = format(new Date(), "yyyy-MM-dd-HHmm");
      const fmtMoney = (n: number | null | undefined) =>
        n == null || Number.isNaN(Number(n)) ? "—" : `$${Number(n).toLocaleString()}`;
      const fmtVar = (n: number | null | undefined) =>
        n == null || Number.isNaN(Number(n)) ? "—" : `$${Number(n).toLocaleString()}`;
      const planRows = canAccessEventPlan ? eventPlanRows : [];
      await downloadAnalyticsReportsPdf({
        title: "Analytics & Reports",
        generatedAtLabel: format(new Date(), "PPpp"),
        fileSlug: slug,
        eventPlan: planRows.map((r) => ({
          title: r.title,
          locationLabel: r.locationLabel,
          budgetPlan: fmtMoney(r.budget),
          budgetActual: fmtMoney(r.budgetActualSpend),
          variance: fmtVar(r.budgetVariance),
          taskCompletion:
            r.taskCompletionRate != null ? `${r.taskCompletionRate.toFixed(1)}%` : "—",
        })),
        budgetVsActual: planRows.map((r) => ({
          name: r.title,
          budget: Number(r.budget) || 0,
          actual: Number(r.budgetActualSpend) || 0,
        })),
        taskCompletion: planRows
          .filter((r) => r.tasksActive > 0 && r.taskCompletionRate != null)
          .map((r) => ({ name: r.title, pct: r.taskCompletionRate! })),
        changeTimeline: reportData?.changesByDate || [],
        topEntities: reportData?.topModifiedEntities || [],
        vendorCategories: vendorSelectionRows.map((r) => ({
          category: r.selection_type,
          selections: String(r.selection_count),
        })),
        vendorSpend: vendorSpendByVendor.map((r) => ({
          vendor: r.vendor,
          spend: fmtMoney(r.actual),
        })),
        locations: locationPerformanceMemo.map((r) => ({
          location: r.location,
          events: String(r.events),
          avgCompletion: r.avgCompletion != null ? `${r.avgCompletion.toFixed(1)}%` : "—",
        })),
      });
      toast({ title: "PDF ready", description: "Full analytics pack downloaded." });
    } catch (e) {
      console.error(e);
      toast({
        title: "PDF export failed",
        description: plannerSafeErrorToastDescription(e, plannerToolsCopy.reportsChangeActivityFailed),
        variant: "destructive",
      });
    } finally {
      setPdfExporting(false);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'created': return 'default';
      case 'updated': return 'secondary';
      case 'deleted': return 'destructive';
      case 'assigned': return 'outline';
      default: return 'secondary';
    }
  };

  const uniqueEntityTypes = [...new Set(changeLogs.map(log => log.entity_type))];
  const uniqueActions = [...new Set(changeLogs.map(log => log.action))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics &amp; Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Event plan, budgets, vendor and location performance, change analytics, and exports.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" className="flex items-center gap-2 shrink-0" disabled={pdfExporting}>
              <Download className="h-4 w-4" />
              {pdfExporting ? "Building PDF…" : "Export"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {canAccessEventPlan ? (
              <DropdownMenuItem onClick={exportEventPlanCsv}>CSV — Event plan</DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={exportChangeLogsCsv}>CSV — Activity feed (filtered)</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                void exportUnifiedAuditEventsCsv();
              }}
            >
              CSV — Unified audit (unified_audit_events view)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportAnalyticsSummaryCsv}>CSV — Analytics summary</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                void exportFullPdfPack();
              }}
            >
              PDF — Full pack
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {activeTab !== "overview" && (
        <>
          {(dueSoonCount !== null || vendorCategoryRows !== null) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Events starting within 48h</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{dueSoonCount ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">Events starting in the next two days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Vendor / resource selection rows</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{vendorCategoryRows ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">Vendor categories in use across events</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters (change logs & derived analytics) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
                {changeLogsLoading ? (
                  <span className="text-xs font-normal text-muted-foreground ml-2">(updating…)</span>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <DatePickerWithRange
                    date={dateRange}
                    onDateChange={setDateRange}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Entity Type</label>
                  <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {uniqueEntityTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.replace('_', ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Action</label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      {uniqueActions.map(action => (
                        <SelectItem key={action} value={action}>
                          {action.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setDateRange(undefined);
                      setEntityTypeFilter('all');
                      setActionFilter('all');
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Tabs value={activeTab} onValueChange={onReportTabChange} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger
            value="overview"
            disabled={eventPlanOwnerReady && !canAccessEventPlan}
            title={
              eventPlanOwnerReady && !canAccessEventPlan
                ? "Owner only: you need at least one active (non-archived) event you own."
                : undefined
            }
            className={
              eventPlanOwnerReady && !canAccessEventPlan ? "opacity-60 cursor-not-allowed" : undefined
            }
          >
            Event Plan Report
          </TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="change-requests">Change Request Report</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Logs</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Plan Report</CardTitle>
            </CardHeader>
            <CardContent>
              {!canAccessEventPlan && eventPlanOwnerReady ? (
                <p className="text-sm text-muted-foreground py-8 text-center max-w-md mx-auto">
                  The Event Plan Report is available only when you own at least one active (non-archived) event.
                  Create an event or ask your coordinator to share the right reports with you.
                </p>
              ) : eventPlanLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading event plans…</p>
              ) : eventPlanRows.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No active events yet. Create an event to see your plan here.
                </p>
              ) : (
                <ScrollArea className="h-[min(70vh,560px)] w-full rounded-md border">
                  <div className="min-w-[1040px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Theme</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Venue</TableHead>
                        <TableHead>Primary location</TableHead>
                        <TableHead className="text-right">Budget (plan)</TableHead>
                        <TableHead className="text-right">Actual spend</TableHead>
                        <TableHead className="text-right">Variance</TableHead>
                        <TableHead className="text-right">Attendees</TableHead>
                        <TableHead>Tasks (completed / active)</TableHead>
                        <TableHead className="text-right">Completion</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="text-right">Manage event</TableHead>
                        <TableHead className="text-right">Create change request</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventPlanRows.map((row) => {
                        const statusBadge = getLifecycleTableBadge({
                          status: row.status,
                          start_date: row.start_date,
                          end_date: row.end_date,
                          archived: false,
                        });
                        return (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium max-w-[12rem] truncate">{row.title}</TableCell>
                          <TableCell className="text-sm">{row.themeName}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {row.start_date
                              ? format(new Date(row.start_date + "T12:00:00"), "MMM d, yyyy")
                              : "—"}
                            {row.end_date ? ` → ${format(new Date(row.end_date + "T12:00:00"), "MMM d, yyyy")}` : ""}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.variant} className="capitalize">
                              {statusBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm max-w-[10rem] truncate">{row.venue || "—"}</TableCell>
                          <TableCell className="text-sm max-w-[10rem] truncate">{row.locationLabel}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.budget != null ? `$${Number(row.budget).toLocaleString()}` : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.budgetActualSpend != null
                              ? `$${Number(row.budgetActualSpend).toLocaleString()}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.budgetVariance != null
                              ? `$${Number(row.budgetVariance).toLocaleString()}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.expected_attendees != null ? row.expected_attendees : "—"}
                          </TableCell>
                          <TableCell className="text-sm tabular-nums">
                            {row.tasksActive === 0
                              ? "—"
                              : `${row.tasksDone} / ${row.tasksActive}`}
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums">
                            {row.taskCompletionRate != null ? `${row.taskCompletionRate.toFixed(1)}%` : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {row.updated_at
                              ? format(new Date(row.updated_at), "MMM d, yyyy HH:mm")
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="link" className="h-auto p-0" asChild>
                              <Link to={`/dashboard/manage-event?eventId=${row.id}`}>Open</Link>
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="link" className="h-auto p-0" asChild>
                              <Link
                                to={`/dashboard/project-management?eventId=${encodeURIComponent(row.id)}&tab=collaborator`}
                              >
                                Open
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                      })}
                    </TableBody>
                  </Table>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <ReportsInsightsTab
            budgetVsActual={insightsProps.budgetVsActual}
            taskCompletionRates={insightsProps.taskCompletionRates}
            vendorSelectionsByCategory={insightsProps.vendorSelectionsByCategory}
            vendorSpendTop={insightsProps.vendorSpendTop}
            locationPerformance={insightsProps.locationPerformance}
            changeFrequency={insightsProps.changeFrequency}
          />
        </TabsContent>

        <TabsContent value="change-requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Request Report</CardTitle>
              <CardDescription>
                Activity rows tied to change requests. Adjust filters above to change the date range.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changeRequestLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No change request rows in this range.
                        </TableCell>
                      </TableRow>
                    ) : (
                      changeRequestLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs">
                            {format(new Date(log.created_at), "MMM dd, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>{log.entity_type}</TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell className="text-xs">
                            {log.changed_by
                              ? userDisplayNames[log.changed_by] ||
                                `${log.changed_by.substring(0, 8)}…`
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData?.changesByDate || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="changes" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Modified Entities</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData?.topModifiedEntities || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="entity" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="changes" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Change Logs</CardTitle>
              <CardDescription>
                Complete audit trail of all system changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changeLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No activity logged yet. Changes to events and tasks will appear here automatically.
                        </TableCell>
                      </TableRow>
                    ) : changeLogs.map((log) => {
                      const meta = log.metadata as Record<string, unknown> | null;
                      const detail = meta
                        ? Object.entries(meta)
                            .filter(([, v]) => v !== null && v !== undefined)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(', ')
                            .substring(0, 60)
                        : '';
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs">
                            {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {log.entity_type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getActionBadgeVariant(log.action)}>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <span className="text-xs text-muted-foreground">
                              {detail || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.changed_by
                              ? (userDisplayNames[log.changed_by] || log.changed_by.substring(0, 8) + '...')
                              : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Peak Activity Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const hourChanges = changeLogs.filter(log => 
                      new Date(log.created_at).getHours() === hour
                    ).length;
                    const maxChanges = Math.max(...Array.from({ length: 24 }, (_, h) => 
                      changeLogs.filter(log => new Date(log.created_at).getHours() === h).length
                    ));
                    const percentage = maxChanges > 0 ? (hourChanges / maxChanges) * 100 : 0;
                    
                    return (
                      <div key={hour} className="flex items-center space-x-2">
                        <span className="text-xs w-12">
                          {hour.toString().padStart(2, '0')}:00
                        </span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs w-8">{hourChanges}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Most Active Day</span>
                    <Badge>
                      {changeLogs.length > 0 ? format(
                        new Date(changeLogs.reduce((a, b) => 
                          new Date(a.created_at) > new Date(b.created_at) ? a : b
                        ).created_at), 'EEEE'
                      ) : 'N/A'}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Most Changed Entity</span>
                    <Badge variant="secondary">
                      {reportData?.topModifiedEntities?.[0]?.entity || 'N/A'}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Common Action</span>
                    <Badge variant="outline">
                      {uniqueActions.reduce((a, b) => 
                        changeLogs.filter(log => log.action === a).length >
                        changeLogs.filter(log => log.action === b).length ? a : b
                      , uniqueActions[0] || 'N/A')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
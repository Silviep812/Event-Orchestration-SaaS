import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  Calendar,
  MapPin,
  Palette,
  Users,
  Printer,
  Pencil,
  FileText,
  DollarSign,
  CheckSquare,
  AlertCircle,
  Building2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  venue: string | null;
  location: string | null;
  budget: number | null;
  expected_attendees: number | null;
  theme_id: number | null;
  external_supplier_ids: string[] | null;
  user_id: string;
};

type TaskRow = {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  category: string | null;
  assigned_to_display_name: string | null;
  due_date?: string | null;
};

type BudgetRow = {
  id: string;
  category: string | null;
  description: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  vendor_name: string | null;
};

type SupplierRow = {
  id: string;
  business_name: string;
  category_id?: number | null;
};

type ChangeRequestRow = {
  id: string;
  created_at: string;
  description: string | null;
  field_changed: string | null;
  status: string | null;
  priority_tag: string | null;
  new_value: string | null;
  old_value: string | null;
};

const fmtCurrency = (n: number | null | undefined) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
        Number(n),
      );

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—";
  try {
    return format(new Date(d), "MMM d, yyyy");
  } catch {
    return d;
  }
};

const statusVariant = (s: string | null | undefined) => {
  switch ((s || "").toLowerCase()) {
    case "completed":
    case "approved":
    case "done":
      return "default" as const;
    case "in_progress":
    case "pending":
      return "secondary" as const;
    case "cancelled":
    case "rejected":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
};

export default function PreviewEventPlan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState<Pick<EventRow, "id" | "title" | "start_date">[]>([]);
  const [eventId, setEventId] = useState<string>("");
  const [event, setEvent] = useState<EventRow | null>(null);
  const [themeName, setThemeName] = useState<string>("—");
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [budget, setBudget] = useState<BudgetRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequestRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Load owner's events
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, start_date, archived")
        .eq("user_id", user.id)
        .eq("archived", false)
        .order("start_date", { ascending: true });
      if (cancelled) return;
      if (error) {
        toast({ title: "Could not load events", description: error.message, variant: "destructive" });
        return;
      }
      const rows = (data || []).map((e) => ({
        id: e.id,
        title: e.title,
        start_date: e.start_date,
      }));
      setEvents(rows);
      const urlId = searchParams.get("eventId");
      const initial = urlId && rows.some((r) => r.id === urlId) ? urlId : rows[0]?.id || "";
      setEventId(initial);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Sync URL ?eventId
  useEffect(() => {
    if (!eventId) return;
    if (searchParams.get("eventId") === eventId) return;
    const next = new URLSearchParams(searchParams);
    next.set("eventId", eventId);
    setSearchParams(next, { replace: true });
  }, [eventId]);

  // Load all data for the selected event
  useEffect(() => {
    if (!eventId) {
      setEvent(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [evRes, taskRes, budgetRes, crRes] = await Promise.all([
          supabase
            .from("events")
            .select(
              "id, title, description, start_date, end_date, status, venue, location, budget, expected_attendees, theme_id, external_supplier_ids, user_id",
            )
            .eq("id", eventId)
            .maybeSingle(),
          supabase
            .from("tasks")
            .select("id, title, status, priority, category, assigned_to_display_name, due_date")
            .eq("event_id", eventId)
            .eq("archived", false)
            .order("due_date", { ascending: true, nullsFirst: false }),
          supabase
            .from("budget_items")
            .select("id, category, description, estimated_cost, actual_cost, vendor_name, archived")
            .eq("event_id", eventId),
          (supabase as any)
            .from("cm_change_requests")
            .select("id, created_at, description, field_changed, status, priority_tag, new_value, old_value")
            .eq("event_id", eventId)
            .order("created_at", { ascending: false }),
        ]);

        if (cancelled) return;

        const ev = (evRes.data as EventRow | null) || null;
        setEvent(ev);

        if (ev?.theme_id != null) {
          const { data: th } = await supabase
            .from("Themes Directory Catalog")
            .select("name")
            .eq("id", ev.theme_id)
            .maybeSingle();
          setThemeName(th?.name || "—");
        } else {
          setThemeName("—");
        }

        setTasks(((taskRes.data as TaskRow[] | null) || []) as TaskRow[]);
        const bRows = ((budgetRes.data as (BudgetRow & { archived?: boolean })[] | null) || []).filter(
          (b) => !b.archived,
        );
        setBudget(bRows);
        setChangeRequests(((crRes.data as ChangeRequestRow[] | null) || []) as ChangeRequestRow[]);

        const supplierIds = ev?.external_supplier_ids || [];
        if (supplierIds.length > 0) {
          const { data: sup } = await supabase
            .from("suppliers")
            .select("id, business_name, category_id")
            .in("id", supplierIds);
          if (!cancelled) setSuppliers(((sup as SupplierRow[]) || []) as SupplierRow[]);
        } else {
          setSuppliers([]);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          toast({
            title: "Could not load event plan",
            description: e instanceof Error ? e.message : "Unknown error",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  // Unique collaborators from task assignments
  const collaborators = useMemo(() => {
    const map = new Map<string, { name: string; tasks: number }>();
    for (const t of tasks) {
      const n = (t.assigned_to_display_name || "").trim();
      if (!n) continue;
      const e = map.get(n) || { name: n, tasks: 0 };
      e.tasks += 1;
      map.set(n, e);
    }
    return [...map.values()].sort((a, b) => b.tasks - a.tasks);
  }, [tasks]);

  const budgetTotals = useMemo(() => {
    const est = budget.reduce((s, b) => s + (Number(b.estimated_cost) || 0), 0);
    const act = budget.reduce((s, b) => s + (Number(b.actual_cost) || 0), 0);
    const plan = event?.budget != null ? Number(event.budget) : null;
    return {
      estimated: est,
      actual: act,
      plan,
      variance: plan != null ? plan - act : null,
    };
  }, [budget, event?.budget]);

  const tasksDone = tasks.filter((t) => (t.status || "").toLowerCase() === "completed").length;
  const tasksActive = tasks.filter((t) => (t.status || "").toLowerCase() !== "cancelled").length;
  const completionRate = tasksActive > 0 ? Math.round((tasksDone / tasksActive) * 100) : null;

  const isOwner = !!event && !!user?.id && event.user_id === user.id;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { padding: 0 !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between no-print">
        <div>
          <h1 className="text-3xl font-bold">Preview Event Plan</h1>
          <p className="text-muted-foreground">
            Complete summary of your event. Use the buttons on the right to edit or export.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={eventId} onValueChange={setEventId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {events.length === 0 && (
                <SelectItem value="__none" disabled>
                  No events available
                </SelectItem>
              )}
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title}
                  {e.start_date ? ` — ${fmtDate(e.start_date)}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/manage-event?eventId=${eventId}`)}
            disabled={!eventId || !isOwner}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button onClick={() => window.print()} disabled={!eventId}>
            <Printer className="mr-2 h-4 w-4" />
            Print / Export PDF
          </Button>
        </div>
      </div>

      {!eventId && (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            <FileText className="mx-auto mb-3 h-10 w-10 opacity-50" />
            No event selected. Create an event first to preview its plan.
          </CardContent>
        </Card>
      )}

      {eventId && loading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {eventId && !loading && event && (
        <div className="print-area space-y-6">
          {/* Header / Event Details */}
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl">{event.title}</CardTitle>
                  {event.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                  )}
                </div>
                {event.status && (
                  <Badge variant={statusVariant(event.status)} className="capitalize">
                    {event.status.replace(/_/g, " ")}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem
                icon={<Calendar className="h-4 w-4" />}
                label="Dates"
                value={`${fmtDate(event.start_date)} → ${fmtDate(event.end_date)}`}
              />
              <DetailItem
                icon={<MapPin className="h-4 w-4" />}
                label="Location"
                value={event.location || event.venue || "—"}
              />
              <DetailItem icon={<Palette className="h-4 w-4" />} label="Theme" value={themeName} />
              <DetailItem
                icon={<Users className="h-4 w-4" />}
                label="Expected attendees"
                value={event.expected_attendees != null ? String(event.expected_attendees) : "—"}
              />
            </CardContent>
          </Card>

          {/* Summary tiles */}
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryTile
              icon={<CheckSquare className="h-5 w-5" />}
              label="Tasks"
              value={`${tasksDone} / ${tasksActive}`}
              hint={completionRate != null ? `${completionRate}% complete` : "No active tasks"}
            />
            <SummaryTile
              icon={<DollarSign className="h-5 w-5" />}
              label="Budget"
              value={fmtCurrency(budgetTotals.plan ?? budgetTotals.estimated)}
              hint={`Spent ${fmtCurrency(budgetTotals.actual)}${
                budgetTotals.variance != null ? ` · ${fmtCurrency(budgetTotals.variance)} left` : ""
              }`}
            />
            <SummaryTile
              icon={<AlertCircle className="h-5 w-5" />}
              label="Change requests"
              value={String(changeRequests.length)}
              hint={`${changeRequests.filter((c) => (c.status || "").toLowerCase() === "pending").length} pending`}
            />
          </div>

          {/* Tasks */}
          <Section title="Task List" icon={<CheckSquare className="h-5 w-5" />}>
            {tasks.length === 0 ? (
              <EmptyText>No tasks yet.</EmptyText>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.title}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">{t.category || "—"}</TableCell>
                      <TableCell>{t.assigned_to_display_name || "—"}</TableCell>
                      <TableCell>{fmtDate(t.due_date)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(t.status)} className="capitalize">
                          {(t.status || "todo").replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Section>

          {/* Budget */}
          <Section title="Budget Summary" icon={<DollarSign className="h-5 w-5" />}>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <MiniStat label="Planned" value={fmtCurrency(budgetTotals.plan)} />
              <MiniStat label="Estimated" value={fmtCurrency(budgetTotals.estimated)} />
              <MiniStat label="Actual" value={fmtCurrency(budgetTotals.actual)} />
            </div>
            {budget.length === 0 ? (
              <EmptyText>No budget items.</EmptyText>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Estimated</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budget.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="capitalize">{b.category || "—"}</TableCell>
                      <TableCell>{b.description || "—"}</TableCell>
                      <TableCell>{b.vendor_name || "—"}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {fmtCurrency(b.estimated_cost)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">{fmtCurrency(b.actual_cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Section>

          {/* Collaborators */}
          <Section title="Collaborator Assignments" icon={<Users className="h-5 w-5" />}>
            {collaborators.length === 0 ? (
              <EmptyText>No collaborators assigned to tasks yet.</EmptyText>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Collaborator</TableHead>
                    <TableHead className="text-right">Assigned tasks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collaborators.map((c) => (
                    <TableRow key={c.name}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-right">{c.tasks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Section>

          {/* Vendors */}
          <Section title="Vendor List" icon={<Building2 className="h-5 w-5" />}>
            {suppliers.length === 0 ? (
              <EmptyText>No vendors linked to this event.</EmptyText>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {suppliers.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-lg border bg-card px-3 py-2 text-sm"
                  >
                    {s.business_name}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Change Requests */}
          <Section title="Change Request History" icon={<FileText className="h-5 w-5" />}>
            {changeRequests.length === 0 ? (
              <EmptyText>No change requests submitted.</EmptyText>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {changeRequests.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="whitespace-nowrap">{fmtDate(c.created_at)}</TableCell>
                      <TableCell className="capitalize">{c.field_changed || "—"}</TableCell>
                      <TableCell className="max-w-md truncate">{c.description || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(c.status)} className="capitalize">
                          {(c.status || "pending").replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Section>

          <Separator />
          <p className="text-xs text-muted-foreground">
            Generated {format(new Date(), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      )}
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

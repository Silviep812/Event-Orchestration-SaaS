import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEventFilter } from "@/hooks/useEventFilter";
import { eventSelectLifecycleLabel } from "@/lib/eventStatus";
import { useToast } from "@/hooks/use-toast";
import { differenceInCalendarDays, parseISO, format } from "date-fns";
import { BarChart3 } from "lucide-react";

interface TaskRow {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  due_date: string | null;
  status: string | null;
}

function parseDay(s: string | null | undefined): Date | null {
  if (!s) return null;
  try {
    return parseISO(s);
  } catch {
    return null;
  }
}

export default function TaskTimeline() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { events, eventsLoading } = useEventFilter();
  const [eventId, setEventId] = useState<string>("");
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get("eventId");
    if (q && events.some((e) => e.id === q)) {
      setEventId(q);
      return;
    }
    if (events.length && !eventId) {
      setEventId(events[0].id);
    }
  }, [events, eventId, searchParams]);

  useEffect(() => {
    const load = async () => {
      if (!user?.id || !eventId) {
        setTasks([]);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, start_date, end_date, due_date, status")
        .eq("event_id", eventId)
        .eq("archived", false)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Could not load tasks",
          description: error.message,
        });
        setTasks([]);
      } else {
        setTasks((data ?? []) as TaskRow[]);
      }
      setLoading(false);
    };
    void load();
  }, [user?.id, eventId]);

  const { rangeStart, rangeEnd, rows } = useMemo(() => {
    const now = new Date();
    let minD: Date | null = null;
    let maxD: Date | null = null;

    for (const t of tasks) {
      const start = parseDay(t.start_date) ?? parseDay(t.due_date);
      const end = parseDay(t.end_date) ?? parseDay(t.due_date) ?? start;
      if (start) {
        minD = minD ? (start < minD ? start : minD) : start;
      }
      if (end) {
        maxD = maxD ? (end > maxD ? end : maxD) : end;
      }
    }

    if (!minD && !maxD) {
      minD = now;
      maxD = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (minD && !maxD) {
      maxD = new Date(minD.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (!minD && maxD) {
      minD = new Date(maxD.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const totalDays = Math.max(1, differenceInCalendarDays(maxD!, minD!) + 1);

    const computed = tasks.map((t) => {
      const start = parseDay(t.start_date) ?? parseDay(t.due_date) ?? minD!;
      const end = parseDay(t.end_date) ?? parseDay(t.due_date) ?? start;
      const s = start < minD! ? minD! : start;
      const e = end > maxD! ? maxD! : end;
      const left = (differenceInCalendarDays(s, minD!) / totalDays) * 100;
      const span = Math.max(
        2,
        (differenceInCalendarDays(e, s) + 1) / totalDays * 100
      );
      return { task: t, left, width: Math.min(100 - left, span) };
    });

    return { rangeStart: minD!, rangeEnd: maxD!, rows: computed };
  }, [tasks]);

  const statusSummary = useMemo(() => {
    let active = 0;
    let notStarted = 0;
    let completed = 0;
    let inProgress = 0;
    for (const t of tasks) {
      const s = (t.status ?? "").toLowerCase();
      if (s === "completed") completed++;
      else if (s === "in_progress") {
        inProgress++;
        active++;
      } else if (s === "not_started") notStarted++;
      else if (s && s !== "cancelled") active++;
    }
    return { active, notStarted, completed, inProgress, total: tasks.length };
  }, [tasks]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          Event Timeline
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Milestone-style bars from each task&apos;s start/end/due dates for the selected event.
        </p>
        {eventId && tasks.length > 0 && (
          <p className="text-sm font-medium text-foreground">
            Timeline status:{" "}
            <span className="text-primary">{statusSummary.inProgress} in progress</span>
            {" · "}
            <span className="text-muted-foreground">{statusSummary.notStarted} not started</span>
            {" · "}
            <span className="text-green-600">{statusSummary.completed} completed</span>
            {" · "}
            {statusSummary.total} tasks plotted
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event</CardTitle>
          <CardDescription>Select an event to plot its tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={eventId}
            onValueChange={setEventId}
            disabled={eventsLoading || events.length === 0}
          >
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Choose event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title}
                  <span className="text-muted-foreground">{` · ${eventSelectLifecycleLabel(e)}`}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
          <CardDescription>
            {rangeStart && rangeEnd && (
              <>
                Range: {format(rangeStart, "MMM d, yyyy")} — {format(rangeEnd, "MMM d, yyyy")}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading || eventsLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground">
              No tasks with dates for this event. Add start or due dates in Project Management.
            </p>
          ) : (
            <div className="space-y-3">
              {rows.map(({ task, left, width }) => (
                <div key={task.id} className="space-y-1">
                  <div className="flex justify-between text-sm gap-2">
                    <span className="font-medium truncate">{task.title}</span>
                    <span className="text-muted-foreground shrink-0 capitalize">
                      {(task.status ?? "").replace(/_/g, " ") || "—"}
                    </span>
                  </div>
                  <div className="relative h-8 rounded-md bg-muted overflow-hidden">
                    <div
                      className="absolute top-1 bottom-1 rounded bg-primary/80"
                      style={{ left: `${left}%`, width: `${width}%` }}
                      title={`${task.title}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

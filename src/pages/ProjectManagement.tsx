import { TaskManager } from "@/components/TaskManager";
import { BudgetTracker } from "@/components/BudgetTracker";
import { RoleManager } from "@/components/RoleManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEventFilter } from "@/hooks/useEventFilter";
import { CheckCircle2, Clock, DollarSign, Users } from "lucide-react";
import { format } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";

export default function ProjectManagement() {
  const { selectedEventFilter, setSelectedEventFilter, events, eventsLoading } = useEventFilter();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Only apply ?eventId= once events are loaded. Radix Select throws if `value` has no matching SelectItem.
  useEffect(() => {
    const eid = searchParams.get("eventId");
    if (!eid || eventsLoading) return;
    if (events.some((e) => e.id === eid)) {
      setSelectedEventFilter(eid);
    }
  }, [searchParams, events, eventsLoading, setSelectedEventFilter]);

  const selectFilterValue =
    selectedEventFilter === "all" || events.some((e) => e.id === selectedEventFilter)
      ? selectedEventFilter
      : "all";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Management</h1>
          <p className="text-muted-foreground">
            Manage tasks, track budgets, and assign roles for your events
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
            Save and exit
          </Button>
        <div className="flex items-center gap-4">
          <Label htmlFor="event-filter" className="text-sm font-medium">
            Filter by Event:
          </Label>
          <Select value={selectFilterValue} onValueChange={setSelectedEventFilter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select an event to filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title} {event.start_date && `(${format(new Date(event.start_date), 'MMM d, yyyy')})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        </div>
      </div>

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <TaskManager selectedEventFilter={selectedEventFilter} />
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <BudgetTracker selectedEventFilter={selectedEventFilter} />
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <RoleManager selectedEventFilter={selectedEventFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
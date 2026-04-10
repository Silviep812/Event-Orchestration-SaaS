import { TaskManager } from "@/components/TaskManager";
import { BudgetTracker } from "@/components/BudgetTracker";
import { RoleManager } from "@/components/RoleManager";
import { CollaboratorPanel } from "@/components/CollaboratorPanel";
import { ChangeManagementPanel } from "@/components/ChangeManagementPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEventFilter } from "@/hooks/useEventFilter";
import { CheckCircle2, Construction, DollarSign, Users } from "lucide-react";
import { format } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { eventSelectLifecycleLabel } from "@/lib/eventStatus";

export default function ProjectManagement() {
  const { selectedEventFilter, setSelectedEventFilter, events, eventsLoading } = useEventFilter();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("tasks");

  // Only apply ?eventId= once events are loaded. Radix Select throws if `value` has no matching SelectItem.
  useEffect(() => {
    const eid = searchParams.get("eventId");
    if (!eid || eventsLoading) return;
    if (events.some((e) => e.id === eid)) {
      setSelectedEventFilter(eid);
    }
  }, [searchParams, events, eventsLoading, setSelectedEventFilter]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab === "tasks" ||
      tab === "budget" ||
      tab === "collaborator" ||
      tab === "change-management"
    ) {
      setActiveTab(tab);
    } else if (!tab) {
      setActiveTab("tasks");
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === "tasks") {
          next.delete("tab");
        } else {
          next.set("tab", tab);
        }
        return next;
      },
      { replace: true }
    );
  };

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
            Track tasks, budget, and team collaboration for your events.
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
                  {event.title}
                  {event.start_date && ` (${format(new Date(event.start_date), "MMM d, yyyy")})`}
                  <span className="text-muted-foreground">{` · ${eventSelectLifecycleLabel(event)}`}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 lg:grid-cols-4">
          <TabsTrigger value="tasks" className="w-full flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="budget" className="w-full flex items-center justify-center gap-2">
            <DollarSign className="h-4 w-4" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="collaborator" className="w-full flex items-center justify-center gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="change-management" className="w-full flex items-center justify-center gap-2">
            <Construction className="h-4 w-4" />
            Change Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <TaskManager selectedEventFilter={selectedEventFilter} />
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <BudgetTracker selectedEventFilter={selectedEventFilter} />
        </TabsContent>

        <TabsContent value="collaborator" className="space-y-6">
          <CollaboratorPanel
            selectedEventFilter={selectedEventFilter}
            onChangeRequestPosted={() => handleTabChange("tasks")}
            onGoToTasksTab={() => handleTabChange("tasks")}
          />
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold">Team access &amp; event roles</h3>
            <RoleManager selectedEventFilter={selectedEventFilter} showAddTaskShortcut={false} />
          </div>
        </TabsContent>

        <TabsContent value="change-management" className="space-y-4">
          <ChangeManagementPanel selectedEventFilter={selectedEventFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
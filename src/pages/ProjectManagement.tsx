import { TaskManager } from "@/components/TaskManager";
import { BudgetTracker } from "@/components/BudgetTracker";
import { RoleManager } from "@/components/RoleManager";
import { CollaboratorPanel } from "@/components/CollaboratorPanel";
import { ChangeManagementPanel } from "@/components/ChangeManagementPanel";
import { EventStakeholdersPanel } from "@/components/EventStakeholdersPanel";
import { TeamCommunicationDialog } from "@/components/TeamCommunicationDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEventFilter } from "@/hooks/useEventFilter";
import { CheckCircle2, DollarSign, Users, GitPullRequest } from "lucide-react";
import { format } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { eventSelectLifecycleLabel } from "@/lib/eventStatus";
import { computeEventLifecycle } from "@/lib/eventStatus";
import { useToast } from "@/hooks/use-toast";

export default function ProjectManagement() {
  const { selectedEventFilter, setSelectedEventFilter, events: allEvents, eventsLoading } = useEventFilter();
  // Project Management only operates on Active events: not archived, not cancelled, not past,
  // and with a workflow status of pending / in_progress / confirmed.
  const events = allEvents.filter((e) => computeEventLifecycle(e)?.isActiveEvent);
  const navigate = useNavigate();
  const { toast } = useToast();
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
    if (tab === "tasks" || tab === "budget" || tab === "collaborator" || tab === "change-request") {
      setActiveTab(tab);
    } else if (tab === "change-management") {
      setActiveTab("change-request");
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0 shrink">
          <h1 className="text-3xl font-bold">Project Management</h1>
          <p className="text-muted-foreground">
            Track task assignments, budget, and collaborators for your events.
          </p>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-3 sm:max-w-xl lg:max-w-2xl lg:shrink-0">
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                toast({
                  title: "Saved",
                  description:
                    "Returning to the dashboard. Task and role updates are already stored when you saved each change.",
                });
                navigate("/dashboard");
              }}
            >
              Save and exit
            </Button>
            <TeamCommunicationDialog
              eventId={selectedEventFilter !== "all" ? selectedEventFilter : null}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <Label htmlFor="event-filter" className="text-sm font-medium sm:whitespace-nowrap sm:pt-0.5">
              Filter by Event:
            </Label>
            <Select value={selectFilterValue} onValueChange={setSelectedEventFilter}>
              <SelectTrigger id="event-filter" className="w-full min-w-0 sm:w-64 lg:w-72">
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
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 p-1 sm:grid-cols-4">
          <TabsTrigger value="tasks" className="w-full flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Task
          </TabsTrigger>
          <TabsTrigger value="budget" className="w-full flex items-center justify-center gap-2">
            <DollarSign className="h-4 w-4" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="collaborator" className="w-full flex items-center justify-center gap-2">
            <Users className="h-4 w-4" />
            Collaborator
          </TabsTrigger>
          <TabsTrigger value="change-request" className="w-full flex items-center justify-center gap-2">
            <GitPullRequest className="h-4 w-4" />
            Change Request
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <TaskManager selectedEventFilter={selectedEventFilter} openTaskFromSearchParams={activeTab === "tasks"} />
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <BudgetTracker selectedEventFilter={selectedEventFilter} />
        </TabsContent>

        <TabsContent value="collaborator" className="space-y-8">
          <p className="text-sm text-muted-foreground max-w-3xl border-b pb-6">
            Roles and permissions, task assignments, and collaborator checklists share the event filter above. The{" "}
            <strong className="text-foreground">Task</strong> tab shows the same assignment list when you need it
            without this workspace layout.
          </p>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Role management</h3>
            <RoleManager
              selectedEventFilter={selectedEventFilter}
              showAddTaskShortcut={false}
              suppressPrimaryHeading
            />
          </div>

          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold">Task assignment</h3>
            <p className="text-sm text-muted-foreground">
            Same list and forms as the <strong className="text-foreground">Task</strong> tab: one assignment type per
            task, IEP prerequisite gates, task-to-task dependencies, assignee name, and the matching collaborator
            checklist.
            </p>
            <TaskManager selectedEventFilter={selectedEventFilter} suppressPrimaryHeading />
          </div>

          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold">Create change request</h3>
            <p className="text-sm text-muted-foreground">
              Submitting posts a task to PM Task Management and shows up in Manage Event for the owner to approve or
              decline. You will be notified when the owner acts.
            </p>
            <CollaboratorPanel
              selectedEventFilter={selectedEventFilter}
              onChangeRequestPosted={() => handleTabChange("tasks")}
              onGoToTasksTab={() => handleTabChange("tasks")}
            />
          </div>

          {selectedEventFilter !== "all" ? (
            <div className="space-y-4 border-t pt-6">
              <EventStakeholdersPanel eventId={selectedEventFilter} />
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="change-request" className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Create change request &amp; collaborator checklists</h3>
            <CollaboratorPanel
              selectedEventFilter={selectedEventFilter}
              onChangeRequestPosted={() => handleTabChange("tasks")}
              onGoToTasksTab={() => handleTabChange("tasks")}
            />
          </div>

          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold">Change requests (coordinator review)</h3>
            <p className="text-sm text-muted-foreground max-w-3xl">
              Approve or reject open requests for this event. New requests can be submitted in the section above or from
              Manage Event.
            </p>
            <ChangeManagementPanel selectedEventFilter={selectedEventFilter} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
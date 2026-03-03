import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Check,
  X,
  RefreshCw,
  ListChecks,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type ActiveTab = "total" | "completed" | "unassigned" | "overdue";

interface TaskAssignment {
  id: string;
  user_id: string;
  userName: string;
  taskId: string;
  taskTitle: string;
  taskStatus: string;
  taskPriority: string;
  taskDueDate: string | null;
  eventTitle: string | null;
  taskCategory: string | null;
  isOverdue: boolean;
}

interface TeamMemberWithTasks {
  userId: string;
  userName: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  tasks: TaskAssignment[];
}

interface TeamMemberTaskAssignmentsProps {
  eventId?: string;
  eventTitle?: string;
}

export function TeamMemberTaskAssignments({ eventId, eventTitle }: TeamMemberTaskAssignmentsProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithTasks[]>([]);
  const [unassignedTasks, setUnassignedTasks] = useState<TaskAssignment[]>([]);
  const [unassignedTasksCount, setUnassignedTasksCount] = useState(0);
  const [allUsers, setAllUsers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingAssignments, setPendingAssignments] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<ActiveTab>("total");
  const [unassignedPage, setUnassignedPage] = useState(1);

  const UNASSIGNED_PAGE_SIZE = 10;

  useEffect(() => {
    fetchTaskAssignments();
  }, [eventId]);

  // Reset unassigned page when switching to unassigned tab
  useEffect(() => {
    if (activeTab === "unassigned") setUnassignedPage(1);
  }, [activeTab]);

  const fetchTaskAssignments = async () => {
    try {
      setLoading(true);

      // Build task query — filter by eventId if provided
      let tasksQuery = supabase
        .from("tasks")
        .select("id, title, status, priority, due_date, assigned_coordinator_name, event_id, category")
        .eq("archived", false)
        .order("due_date", { ascending: true });

      if (eventId) {
        tasksQuery = tasksQuery.eq("event_id", eventId);
      }

      const { data: tasks, error: tasksError } = await tasksQuery;
      if (tasksError) throw tasksError;

      const filteredTasks = tasks || [];
      const now = new Date();

      // Fetch profiles for the reassign dropdown
      const { data: profiles } = await supabase
        .from("profiles")
        .select("display_name, user_id")
        .not("display_name", "is", null);

      const uniqueCollaborators = [
        ...new Set(filteredTasks.map((t) => t.assigned_coordinator_name).filter(Boolean) as string[]),
      ];
      const profileNames = profiles?.map((p) => p.display_name as string) || [];
      const allUniqueNames = [...new Set([...uniqueCollaborators, ...profileNames])].sort();

      setAllUsers(allUniqueNames.map((name) => ({ id: name, name })));

      // Fetch event titles if needed
      const eventIds = [...new Set(filteredTasks.map((t) => t.event_id).filter(Boolean))];
      let eventMap = new Map<string, string>();
      if (eventIds.length > 0) {
        const { data: events } = await supabase.from("events").select("id, title").in("id", eventIds);
        eventMap = new Map(events?.map((e) => [e.id, e.title]) || []);
      }

      const toAssignment = (task: (typeof filteredTasks)[0], name = ""): TaskAssignment => {
        const isOverdue = !!task.due_date && new Date(task.due_date) < now && task.status !== "completed";
        return {
          id: task.id,
          user_id: name,
          userName: name,
          taskId: task.id,
          taskTitle: task.title,
          taskStatus: task.status || "not_started",
          taskPriority: task.priority,
          taskDueDate: task.due_date,
          eventTitle: task.event_id ? eventTitle || eventMap.get(task.event_id) || null : null,
          taskCategory: task.category,
          isOverdue,
        };
      };

      // Unassigned
      const unassigned = filteredTasks.filter((t) => !t.assigned_coordinator_name);
      setUnassignedTasksCount(unassigned.length);
      setUnassignedTasks(unassigned.map((t) => toAssignment(t)));
      setUnassignedPage(1); // reset page on fresh data

      // Group assigned by coordinator
      const userTasksMap = new Map<string, TaskAssignment[]>();
      filteredTasks.forEach((task) => {
        const name = task.assigned_coordinator_name;
        if (!name) return;
        if (!userTasksMap.has(name)) userTasksMap.set(name, []);
        userTasksMap.get(name)!.push(toAssignment(task, name));
      });

      const teamMembersData: TeamMemberWithTasks[] = Array.from(userTasksMap.entries()).map(
        ([userId, memberTasks]) => ({
          userId,
          userName: memberTasks[0].userName,
          totalTasks: memberTasks.length,
          completedTasks: memberTasks.filter((t) => t.taskStatus === "completed").length,
          pendingTasks: memberTasks.filter((t) => t.taskStatus !== "completed").length,
          overdueTasks: memberTasks.filter((t) => t.isOverdue).length,
          tasks: memberTasks,
        }),
      );

      teamMembersData.sort((a, b) => b.totalTasks - a.totalTasks);
      setTeamMembers(teamMembersData);
    } catch (error) {
      console.error("Error fetching task assignments:", error);
      toast.error("Failed to load team member task assignments");
    } finally {
      setLoading(false);
    }
  };

  const assignTask = async (taskId: string, collaboratorName: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ assigned_coordinator_name: collaboratorName })
        .eq("id", taskId);
      if (error) throw error;
      toast.success("Task assigned successfully");
      fetchTaskAssignments();
    } catch {
      toast.error("Failed to assign task");
    }
  };

  const reassignTask = async (taskId: string, newCollaboratorName: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ assigned_coordinator_name: newCollaboratorName })
        .eq("id", taskId);
      if (error) throw error;
      toast.success("Task reassigned successfully");
      fetchTaskAssignments();
    } catch {
      toast.error("Failed to reassign task");
    }
  };

  // ── Derived counts ──────────────────────────────────────────────────────────
  const totalAssigned = teamMembers.reduce((s, m) => s + m.totalTasks, 0);
  const totalTasksCount = totalAssigned + unassignedTasksCount;
  const totalCompleted = teamMembers.reduce((s, m) => s + m.completedTasks, 0);
  const totalOverdue = teamMembers.reduce((s, m) => s + m.overdueTasks, 0);

  // ── Unassigned pagination ───────────────────────────────────────────────────
  const unassignedTotalPages = Math.max(1, Math.ceil(unassignedTasksCount / UNASSIGNED_PAGE_SIZE));
  const unassignedPageStart = (unassignedPage - 1) * UNASSIGNED_PAGE_SIZE;
  const unassignedPageEnd = unassignedPageStart + UNASSIGNED_PAGE_SIZE;
  const pagedUnassignedTasks = unassignedTasks.slice(unassignedPageStart, unassignedPageEnd);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getTaskStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      completed: "Completed",
      in_progress: "In Progress",
      not_started: "Not Started",
      on_hold: "On Hold",
      cancelled: "Cancelled",
    };
    return map[status] ?? status;
  };

  const getStatusIcon = (member: TeamMemberWithTasks) => {
    if (member.overdueTasks > 0) return <AlertCircle className="h-4 w-4 text-destructive" />;
    if (member.pendingTasks > 0) return <Clock className="h-4 w-4 text-amber-500" />;
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  };

  // ── Tab filter logic ────────────────────────────────────────────────────────
  // For each team member, filter the tasks list shown based on active tab
  const getFilteredTasks = (member: TeamMemberWithTasks): TaskAssignment[] => {
    switch (activeTab) {
      case "completed":
        return member.tasks.filter((t) => t.taskStatus === "completed");
      case "overdue":
        return member.tasks.filter((t) => t.isOverdue);
      case "total":
      default:
        return member.tasks;
    }
  };

  // Members that still have tasks to show after filter
  const visibleMembers = teamMembers.filter((m) => getFilteredTasks(m).length > 0);

  // ── Tab config ──────────────────────────────────────────────────────────────
  const tabs: {
    key: ActiveTab;
    label: string;
    count: number;
    icon: React.ReactNode;
    activeClass: string;
    countClass: string;
  }[] = [
    {
      key: "total",
      label: "Total Tasks",
      count: totalTasksCount,
      icon: <ListChecks className="h-4 w-4" />,
      activeClass: "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-sm",
      countClass: "bg-blue-500 text-white",
    },
    {
      key: "completed",
      label: "Completed",
      count: totalCompleted,
      icon: <CheckCircle2 className="h-4 w-4" />,
      activeClass: "border-green-500 bg-green-50 dark:bg-green-950/30 shadow-sm",
      countClass: "bg-green-500 text-white",
    },
    {
      key: "unassigned",
      label: "Unassigned",
      count: unassignedTasksCount,
      icon: <Users className="h-4 w-4" />,
      activeClass: "border-amber-500 bg-amber-50 dark:bg-amber-950/30 shadow-sm",
      countClass: "bg-amber-500 text-white",
    },
    {
      key: "overdue",
      label: "Overdue",
      count: totalOverdue,
      icon: <AlertCircle className="h-4 w-4" />,
      activeClass: "border-red-500 bg-red-50 dark:bg-red-950/30 shadow-sm",
      countClass: "bg-red-500 text-white",
    },
  ];

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 gap-3 text-muted-foreground">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        <span className="text-sm">Loading task assignments...</span>
      </div>
    );
  }

  // ── Render task row (shared between assigned & unassigned) ──────────────────
  const renderTaskRow = (task: TaskAssignment, memberId: string, isUnassigned = false) => (
    <div key={task.taskId} className="p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm">{task.taskTitle}</p>
            {task.taskCategory && (
              <Badge className="bg-primary text-primary-foreground font-semibold text-[10px] px-1.5 py-0">
                {task.taskCategory}
              </Badge>
            )}
            <Badge
              variant={task.taskStatus === "completed" ? "default" : "outline"}
              className="text-[10px] px-1.5 py-0"
            >
              {getTaskStatusLabel(task.taskStatus)}
            </Badge>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getPriorityColor(task.taskPriority)}`}>
              {task.taskPriority}
            </Badge>
          </div>
          {!eventId && task.eventTitle && (
            <p className="text-xs text-muted-foreground mt-1">Event: {task.eventTitle}</p>
          )}
          {task.taskDueDate && (
            <p className={`text-xs mt-1 ${task.isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
              Due: {format(new Date(task.taskDueDate), "MMM d, yyyy")}
              {task.isOverdue && " · Overdue"}
            </p>
          )}
        </div>

        {/* Assign / Reassign controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Select
            value={
              pendingAssignments[`${isUnassigned ? "assign" : "reassign"}-${task.taskId}`] ||
              (isUnassigned ? "" : memberId)
            }
            onValueChange={(val) =>
              setPendingAssignments((prev) => ({
                ...prev,
                [`${isUnassigned ? "assign" : "reassign"}-${task.taskId}`]: val,
              }))
            }
          >
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder={isUnassigned ? "Assign to..." : undefined} />
            </SelectTrigger>
            <SelectContent>
              {allUsers.map((user) => (
                <SelectItem key={user.id} value={user.id} className="text-xs">
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            className="h-8 gap-1 text-xs"
            disabled={
              isUnassigned
                ? !pendingAssignments[`assign-${task.taskId}`]
                : !pendingAssignments[`reassign-${task.taskId}`] ||
                  pendingAssignments[`reassign-${task.taskId}`] === memberId
            }
            onClick={() => {
              const key = `${isUnassigned ? "assign" : "reassign"}-${task.taskId}`;
              const assignee = pendingAssignments[key];
              if (!assignee) return;
              if (isUnassigned) {
                assignTask(task.taskId, assignee);
              } else {
                reassignTask(task.taskId, assignee);
              }
              setPendingAssignments((prev) => {
                const n = { ...prev };
                delete n[key];
                return n;
              });
            }}
          >
            <Check className="h-3.5 w-3.5" />
            {isUnassigned ? "Assign" : "Change"}
          </Button>

          {!isUnassigned && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              disabled={
                !pendingAssignments[`reassign-${task.taskId}`] ||
                pendingAssignments[`reassign-${task.taskId}`] === memberId
              }
              onClick={() =>
                setPendingAssignments((prev) => {
                  const n = { ...prev };
                  delete n[`reassign-${task.taskId}`];
                  return n;
                })
              }
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Team Member Task Assignments</h3>
            <p className="text-xs text-muted-foreground">
              {eventId ? "Tasks assigned to team members for this event" : "All task assignments across events"}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTaskAssignments} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* ── Tab Cards ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                relative flex flex-col gap-1 rounded-xl border-2 p-4 text-left
                transition-all duration-200 cursor-pointer
                hover:shadow-md hover:scale-[1.02]
                ${isActive ? tab.activeClass : "border-border bg-card hover:border-border/80"}
              `}
            >
              {/* Icon + label row */}
              <div
                className={`flex items-center gap-2 text-sm font-medium
                ${
                  isActive
                    ? tab.key === "total"
                      ? "text-blue-700 dark:text-blue-300"
                      : tab.key === "completed"
                        ? "text-green-700 dark:text-green-300"
                        : tab.key === "unassigned"
                          ? "text-amber-700 dark:text-amber-300"
                          : "text-red-700 dark:text-red-300"
                    : "text-muted-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </div>

              {/* Count + optional active indicator */}
              <div className="flex items-end justify-between">
                <span
                  className={`text-3xl font-bold leading-none
                  ${
                    isActive
                      ? tab.key === "total"
                        ? "text-blue-700 dark:text-blue-300"
                        : tab.key === "completed"
                          ? "text-green-700 dark:text-green-300"
                          : tab.key === "unassigned"
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-red-700 dark:text-red-300"
                      : "text-foreground"
                  }`}
                >
                  {tab.count}
                </span>
                {isActive && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tab.countClass}`}>
                    Active
                  </span>
                )}
              </div>

              {/* Bottom accent bar */}
              {isActive && (
                <div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl
                  ${
                    tab.key === "total"
                      ? "bg-blue-500"
                      : tab.key === "completed"
                        ? "bg-green-500"
                        : tab.key === "unassigned"
                          ? "bg-amber-500"
                          : "bg-red-500"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* UNASSIGNED tab */}
        {activeTab === "unassigned" &&
          (unassignedTasksCount === 0 ? (
            <Card className="p-10 text-center border-dashed">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-400" />
              <p className="font-medium text-muted-foreground">All tasks are assigned</p>
              <p className="text-sm text-muted-foreground/70 mt-1">No unassigned tasks for this event.</p>
            </Card>
          ) : (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-3 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <AlertCircle className="h-4 w-4" />
                    Unassigned Tasks ({unassignedTasksCount})
                  </CardTitle>
                  <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                    Showing {unassignedPageStart + 1}–{Math.min(unassignedPageEnd, unassignedTasksCount)} of{" "}
                    {unassignedTasksCount}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {pagedUnassignedTasks.map((task) => renderTaskRow(task, "", true))}
              </CardContent>
              {/* Pagination controls */}
              {unassignedTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-amber-100 dark:border-amber-900/40">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={() => setUnassignedPage((p) => Math.max(1, p - 1))}
                    disabled={unassignedPage === 1}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: unassignedTotalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setUnassignedPage(page)}
                        className={`w-7 h-7 rounded-md text-xs font-medium transition-colors
                          ${
                            page === unassignedPage
                              ? "bg-amber-500 text-white shadow-sm"
                              : "hover:bg-amber-100 dark:hover:bg-amber-900/30 text-muted-foreground"
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={() => setUnassignedPage((p) => Math.min(unassignedTotalPages, p + 1))}
                    disabled={unassignedPage === unassignedTotalPages}
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </Card>
          ))}

        {/* TOTAL / COMPLETED / OVERDUE tabs — show per-member cards */}
        {activeTab !== "unassigned" &&
          (visibleMembers.length === 0 && unassignedTasksCount === 0 ? (
            <Card className="p-10 text-center border-dashed">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">
                {activeTab === "completed"
                  ? "No completed tasks yet"
                  : activeTab === "overdue"
                    ? "No overdue tasks — great work!"
                    : "No task assignments yet"}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {activeTab === "total"
                  ? eventId
                    ? "Assign tasks to team members in the Tasks tab (Project Management)."
                    : "Tasks assigned to team members will appear here."
                  : ""}
              </p>
            </Card>
          ) : visibleMembers.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {activeTab === "completed"
                  ? "No completed tasks across team members."
                  : activeTab === "overdue"
                    ? "No overdue tasks — all on track!"
                    : "No matching tasks."}
              </p>
            </Card>
          ) : (
            visibleMembers.map((member) => {
              const filteredTasks = getFilteredTasks(member);
              return (
                <Card key={member.userId} className="shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getStatusIcon(member)}
                        {member.userName}
                      </CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          {filteredTasks.length}
                          {activeTab !== "total" ? ` ${tabs.find((t) => t.key === activeTab)?.label}` : " Total"}
                        </Badge>
                        {activeTab === "total" && member.completedTasks > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400"
                          >
                            {member.completedTasks} Done
                          </Badge>
                        )}
                        {activeTab === "total" && member.overdueTasks > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400"
                          >
                            {member.overdueTasks} Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {filteredTasks.map((task) => renderTaskRow(task, member.userId))}
                  </CardContent>
                </Card>
              );
            })
          ))}

        {/* When Total tab is active, also show unassigned at bottom if any */}
        {activeTab === "total" && unassignedTasksCount > 0 && (
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-3 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <AlertCircle className="h-4 w-4" />
                  Unassigned Tasks ({unassignedTasksCount})
                </CardTitle>
                {unassignedTasksCount > UNASSIGNED_PAGE_SIZE && (
                  <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                    Showing {unassignedPageStart + 1}–{Math.min(unassignedPageEnd, unassignedTasksCount)} of{" "}
                    {unassignedTasksCount}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {pagedUnassignedTasks.map((task) => renderTaskRow(task, "", true))}
            </CardContent>
            {/* Pagination controls */}
            {unassignedTotalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-amber-100 dark:border-amber-900/40">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => setUnassignedPage((p) => Math.max(1, p - 1))}
                  disabled={unassignedPage === 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: unassignedTotalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setUnassignedPage(page)}
                      className={`w-7 h-7 rounded-md text-xs font-medium transition-colors
                        ${
                          page === unassignedPage
                            ? "bg-amber-500 text-white shadow-sm"
                            : "hover:bg-amber-100 dark:hover:bg-amber-900/30 text-muted-foreground"
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => setUnassignedPage((p) => Math.min(unassignedTotalPages, p + 1))}
                  disabled={unassignedPage === unassignedTotalPages}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

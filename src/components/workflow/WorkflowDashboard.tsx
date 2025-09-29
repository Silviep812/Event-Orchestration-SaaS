import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Settings,
  Plus
} from "lucide-react";

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: "planning" | "progress" | "review" | "complete";
  dueDate: string;
  assignee?: string;
  priority: "low" | "medium" | "high";
}

interface WorkflowDashboardProps {
  userType: string;
  selectedTheme: number;
}

const workflowSteps: Record<string, WorkflowStep[]> = {
  "social-organizer": [
    {
      id: "1",
      title: "Define Event Concept",
      description: "Establish theme, guest count, and basic requirements",
      status: "complete",
      dueDate: "2024-01-15",
      priority: "high"
    },
    {
      id: "2", 
      title: "Set Budget & Timeline",
      description: "Determine available budget and create event timeline",
      status: "progress",
      dueDate: "2024-01-20",
      priority: "high"
    },
    {
      id: "3",
      title: "Book Venue",
      description: "Secure location that fits theme and guest count",
      status: "planning",
      dueDate: "2024-01-25",
      priority: "high"
    },
    {
      id: "4",
      title: "Arrange Catering",
      description: "Select menu options and coordinate food service",
      status: "planning", 
      dueDate: "2024-02-01",
      priority: "medium"
    }
  ],
  "professional-planner": [
    {
      id: "1",
      title: "Client Discovery & Requirements",
      description: "Detailed client consultation and requirement gathering",
      status: "complete",
      dueDate: "2024-01-10",
      priority: "high"
    },
    {
      id: "2",
      title: "Proposal & Contract",
      description: "Create detailed proposal and finalize service agreement",
      status: "progress",
      dueDate: "2024-01-18",
      priority: "high"
    },
    {
      id: "3",
      title: "Vendor Coordination",
      description: "Secure and coordinate all vendor relationships",
      status: "planning",
      dueDate: "2024-01-28",
      priority: "high"
    },
    {
      id: "4",
      title: "Timeline & Logistics",
      description: "Detailed event timeline and logistics planning",
      status: "planning",
      dueDate: "2024-02-05",
      priority: "medium"
    }
  ],
  "hospitality-owner": [
    {
      id: "1",
      title: "Service Menu Planning",
      description: "Define available services and pricing structure",
      status: "complete",
      dueDate: "2024-01-12",
      priority: "high"
    },
    {
      id: "2",
      title: "Staff Coordination",
      description: "Schedule and brief service staff for event",
      status: "progress",
      dueDate: "2024-01-22",
      priority: "high"
    },
    {
      id: "3",
      title: "Supply Chain Management",
      description: "Coordinate ingredients, supplies, and equipment",
      status: "planning",
      dueDate: "2024-01-30",
      priority: "medium"
    },
    {
      id: "4",
      title: "Quality Assurance",
      description: "Final service testing and quality checks",
      status: "planning",
      dueDate: "2024-02-08",
      priority: "medium"
    }
  ],
  "venue-owner": [
    {
      id: "1",
      title: "Space Configuration",
      description: "Optimize venue layout for event requirements",
      status: "complete",
      dueDate: "2024-01-14",
      priority: "high"
    },
    {
      id: "2",
      title: "Facility Preparation",
      description: "Ensure all venue facilities are event-ready",
      status: "progress",
      dueDate: "2024-01-24",
      priority: "high"
    },
    {
      id: "3",
      title: "Technical Setup",
      description: "Configure AV, lighting, and technical requirements",
      status: "planning",
      dueDate: "2024-02-02",
      priority: "medium"
    },
    {
      id: "4",
      title: "Final Inspection",
      description: "Complete venue walkthrough and safety checks",
      status: "planning",
      dueDate: "2024-02-10",
      priority: "medium"
    }
  ]
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "complete": return "bg-status-complete text-white";
    case "progress": return "bg-status-progress text-white";
    case "review": return "bg-status-review text-white";
    default: return "bg-status-planning text-white";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "complete": return CheckCircle2;
    case "progress": return Clock;
    case "review": return AlertCircle;
    default: return Calendar;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high": return "text-destructive";
    case "medium": return "text-primary";
    default: return "text-muted-foreground";
  }
};

export const WorkflowDashboard = ({ userType, selectedTheme }: WorkflowDashboardProps) => {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);

  useEffect(() => {
    setSteps(workflowSteps[userType] || []);
  }, [userType]);

  const completedSteps = steps.filter(step => step.status === "complete").length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  const stats = [
    {
      title: "Workflow Progress",
      value: `${completedSteps}/${steps.length}`,
      description: `${Math.round(progressPercentage)}% Complete`,
      icon: TrendingUp,
    },
    {
      title: "Active Tasks",
      value: steps.filter(step => step.status === "progress").length.toString(),
      description: "Currently in progress",
      icon: Clock,
    },
    {
      title: "Upcoming Deadlines",
      value: steps.filter(step => step.status === "planning").length.toString(),
      description: "Tasks to be started",
      icon: Calendar,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Workflow Dashboard</h1>
          <p className="text-muted-foreground">
            {userType.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())} • Theme ID: {selectedTheme}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Customize
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>Track your event planning workflow completion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Workflow Completion</span>
              <span className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workflow Steps */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="kanban">Task Board</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <div className="space-y-4">
            {steps.map((step, index) => {
              const StatusIcon = getStatusIcon(step.status);
              return (
                <Card key={step.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${getStatusColor(step.status)}`}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{step.title}</CardTitle>
                          <CardDescription>{step.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant="outline" 
                          className={getPriorityColor(step.priority)}
                        >
                          {step.priority.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Due: {new Date(step.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(step.status)}>
                        {step.status.toUpperCase()}
                      </Badge>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {step.status !== "complete" && (
                          <Button size="sm">
                            {step.status === "planning" ? "Start Task" : "Continue"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  {index < steps.length - 1 && (
                    <div className="absolute left-8 bottom-0 w-0.5 h-6 bg-border transform translate-y-full" />
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="kanban">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {["planning", "progress", "review", "complete"].map((status) => (
              <Card key={status}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm capitalize">{status}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {steps
                    .filter(step => step.status === status)
                    .map(step => (
                      <Card key={step.id} className="p-3">
                        <h4 className="font-medium text-sm">{step.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(step.dueDate).toLocaleDateString()}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={`${getPriorityColor(step.priority)} mt-2 text-xs`}
                        >
                          {step.priority}
                        </Badge>
                      </Card>
                    ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
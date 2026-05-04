import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkflow } from "@/hooks/useWorkflow";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
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
  Plus,
  Palette,
  Building,
  Home,
  Package,
  Truck,
  Wrench
} from "lucide-react";

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: "not_started" | "in_progress" | "completed" | "on_hold" | "cancelled";
  assignee?: string;
  priority: "low" | "medium" | "high";
}

type SetupStep = "user-type" | "theme" | "hospitality" | "venue" | "services" | "suppliers" | "dashboard";

interface WorkflowDashboardProps {
  userType: string;
  selectedTheme: number;
  workflowId?: string;
  setCurrentStep?: (step: SetupStep) => void;
  /** When set (e.g. viewing dashboard without wizard state), opens the setup wizard with workflow data. */
  onCustomizeWorkflow?: () => void | Promise<void>;
  onChangeWorkflow?: () => void;
  showChangeWorkflow?: boolean;
  /** Start the wizard to attach a workflow to another event (one workflow per event). */
  onNewWorkflowForAnotherEvent?: () => void;
}

interface WorkflowSelections {
  theme: string;
  hospitality: string;
  venue: string;
  supplier: string;
  serviceVendor: string;
  serviceRental: string;
}

/** Matches the setup wizard: one "services" pick is vendor OR rental; venue-owner skips hospitality & venue. */
function getWorkflowSelectionProgress(
  userType: string,
  selections: WorkflowSelections
): { completed: number; total: number; percentage: number } {
  const hasTheme = Boolean(selections.theme);
  const hasHospitality = Boolean(selections.hospitality);
  const hasVenue = Boolean(selections.venue);
  const hasSupplier = Boolean(selections.supplier);
  const hasServices = Boolean(selections.serviceVendor || selections.serviceRental);

  if (userType === "venue-owner") {
    const slots = [hasTheme, hasServices, hasSupplier];
    const completed = slots.filter(Boolean).length;
    const total = slots.length;
    return {
      completed,
      total,
      percentage: total > 0 ? (completed / total) * 100 : 0,
    };
  }

  const slots = [hasTheme, hasHospitality, hasVenue, hasServices, hasSupplier];
  const completed = slots.filter(Boolean).length;
  const total = slots.length;
  return {
    completed,
    total,
    percentage: total > 0 ? (completed / total) * 100 : 0,
  };
}

interface SelectionCard {
  type: string;
  title: string;
  description: string;
  value: string;
  icon: React.ComponentType<any>;
}

const workflowSteps: Record<string, WorkflowStep[]> = {
  "host": [
    {
      id: "1",
      title: "Define Event Concept",
      description: "Establish theme, guest count, and basic requirements",
      status: "not_started",
      priority: "high"
    },
    {
      id: "2", 
      title: "Set Budget & Timeline",
      description: "Determine available budget and create event timeline",
      status: "not_started",
      priority: "high"
    },
    {
      id: "3",
      title: "Book Venue",
      description: "Secure location that fits theme and guest count",
      status: "not_started",
      priority: "high"
    },
    {
      id: "4",
      title: "Arrange Catering",
      description: "Select menu options and coordinate food service",
      status: "not_started", 
      priority: "medium"
    }
  ],
  "social-organizer": [
    {
      id: "1",
      title: "Define Event Concept",
      description: "Establish theme, guest count, and basic requirements",
      status: "not_started",
      priority: "high"
    },
    {
      id: "2", 
      title: "Set Budget & Timeline",
      description: "Determine available budget and create event timeline",
      status: "not_started",
      priority: "high"
    },
    {
      id: "3",
      title: "Book Venue",
      description: "Secure location that fits theme and guest count",
      status: "not_started",
      priority: "high"
    },
    {
      id: "4",
      title: "Arrange Catering",
      description: "Select menu options and coordinate food service",
      status: "not_started", 
      priority: "medium"
    }
  ],
  "professional-planner": [
    {
      id: "1",
      title: "Client Discovery & Requirements",
      description: "Detailed client consultation and requirement gathering",
      status: "not_started",
      priority: "high"
    },
    {
      id: "2",
      title: "Proposal & Contract",
      description: "Create detailed proposal and finalize service agreement",
      status: "not_started",
      priority: "high"
    },
    {
      id: "3",
      title: "Vendor Coordination",
      description: "Secure and coordinate all vendor relationships",
      status: "not_started",
      priority: "high"
    },
    {
      id: "4",
      title: "Timeline & Logistics",
      description: "Detailed event timeline and logistics planning",
      status: "not_started",
      priority: "medium"
    }
  ],
  "hospitality-provider": [
    {
      id: "1",
      title: "Service Menu Planning",
      description: "Define available services and pricing structure",
      status: "not_started",
      priority: "high"
    },
    {
      id: "2",
      title: "Staff Coordination",
      description: "Schedule and brief service staff for event",
      status: "not_started",
      priority: "high"
    },
    {
      id: "3",
      title: "Supply Chain Management",
      description: "Coordinate ingredients, supplies, and equipment",
      status: "not_started",
      priority: "medium"
    },
    {
      id: "4",
      title: "Quality Assurance",
      description: "Final service testing and quality checks",
      status: "not_started",
      priority: "medium"
    }
  ],
  "venue-owner": [
    {
      id: "1",
      title: "Space Configuration",
      description: "Optimize venue layout for event requirements",
      status: "not_started",
      priority: "high"
    },
    {
      id: "2",
      title: "Facility Preparation",
      description: "Ensure all venue facilities are event-ready",
      status: "not_started",
      priority: "high"
    },
    {
      id: "3",
      title: "AV & lighting",
      description: "Confirm sound, lighting, and staging setup for the room",
      status: "not_started",
      priority: "medium"
    },
    {
      id: "4",
      title: "Final Inspection",
      description: "Complete venue walkthrough and safety checks",
      status: "not_started",
      priority: "medium"
    }
  ]
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed": return "bg-status-complete text-white";
    case "in_progress": return "bg-status-progress text-white";
    case "on_hold": return "bg-status-review text-white";
    case "cancelled": return "bg-status-review text-white";
    default: return "bg-status-planning text-white";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed": return CheckCircle2;
    case "in_progress": return Clock;
    case "on_hold": return AlertCircle;
    case "cancelled": return AlertCircle;
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

export const WorkflowDashboard = ({
  userType,
  selectedTheme,
  workflowId,
  setCurrentStep,
  onCustomizeWorkflow,
  onChangeWorkflow,
  showChangeWorkflow,
  onNewWorkflowForAnotherEvent,
}: WorkflowDashboardProps) => {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [eventTasks, setEventTasks] = useState<any[]>([]);
  const [selections, setSelections] = useState<WorkflowSelections>({
    theme: '',
    hospitality: '',
    venue: '',
    supplier: '',
    serviceVendor: '',
    serviceRental: ''
  });
  const { getWorkflowData, getWorkflowById } = useWorkflow();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [eventTitle, setEventTitle] = useState<string>("");

  const handleOpenTaskManager = async () => {
    const workflowData = workflowId 
      ? await getWorkflowById(workflowId)
      : await getWorkflowData();

    const eventId = workflowData?.event_id;
    
    if (eventId) {
      navigate(`/dashboard/project-management?eventId=${eventId}&openModal=true`);
    } else {
      navigate('/dashboard/project-management?openModal=true');
    }
  };

  const handleCustomize = async () => {
    if (onCustomizeWorkflow) {
      await onCustomizeWorkflow();
      return;
    }
    if (setCurrentStep) {
      setCurrentStep("user-type");
      return;
    }

    const workflowData = workflowId ? await getWorkflowById(workflowId) : await getWorkflowData();
    const eventId = workflowData?.event_id;
    if (eventId) {
      navigate(`/dashboard/workflow-dashboard?eventId=${eventId}`);
    } else {
      navigate("/dashboard/workflow-dashboard");
    }
  };

  const refreshEventTasks = useCallback(async () => {
    const workflowData = workflowId 
      ? await getWorkflowById(workflowId)
      : await getWorkflowData();

    if (workflowData?.event_id) {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('event_id', workflowData.event_id)
        .order('created_at', { ascending: false });

      if (!error) {
        setEventTasks(tasks || []);
      }
    }
  }, [getWorkflowData, getWorkflowById, workflowId]);

  useEffect(() => {
    setSteps(workflowSteps[userType] || []);
  }, [userType]);

  useEffect(() => {
    window.addEventListener('focus', refreshEventTasks);
    return () => window.removeEventListener('focus', refreshEventTasks);
  }, [refreshEventTasks]);

  useEffect(() => {
    const loadEventTasks = async () => {
      const workflowData = workflowId 
        ? await getWorkflowById(workflowId)
        : await getWorkflowData();
        
      if (workflowData?.event_id) {
        const { data: tasks, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('event_id', workflowData.event_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching tasks:', error);
        } else {
          setEventTasks(tasks || []);
        }
      }
    };

    loadEventTasks();
  }, [getWorkflowData, getWorkflowById, workflowId]);

  useEffect(() => {
    const loadWorkflowSelections = async () => {
      const workflowData = workflowId 
        ? await getWorkflowById(workflowId)
        : await getWorkflowData();
      if (workflowData) {
        // Fetch actual names/details for selected items
        const newSelections: WorkflowSelections = {
          theme: '',
          hospitality: '',
          venue: '',
          supplier: '',
          serviceVendor: '',
          serviceRental: ''
        };

        // Fetch theme name
        if (workflowData.theme_id) {
          const { data: theme } = await supabase
            .from('Themes Directory Catalog')
            .select('name')
            .eq('id', workflowData.theme_id)
            .limit(1)
            .maybeSingle();

          if (theme) {
            // Find the matching theme field
            const themeKeys = Object.keys(theme).filter(key => 
              key !== 'created_at' && theme[key as keyof typeof theme]
            );
            newSelections.theme = theme.name || themeKeys[0];
          }
        }

        // Fetch hospitality name
        if (workflowData.hospitality_id) {
          const { data: hospitality } = await supabase
            .from('hospitality_profiles')
            .select('business_name')
            .eq('id', workflowData.hospitality_id)
            .limit(1)
            .maybeSingle();
          newSelections.hospitality = hospitality?.business_name || `Hospitality ${workflowData.hospitality_id}`;
        }

        // Fetch venue name
        if (workflowData.venue_id) {
          const { data: venue } = await supabase
            .from('venues')
            .select('business_name')
            .eq('id', workflowData.venue_id)
            .limit(1)
            .maybeSingle();
          newSelections.venue = venue?.business_name || `Venue ${workflowData.venue_id}`;
        }

        // Fetch supplier name
        if (workflowData.supplier_id) {
          const { data: supplier } = await supabase
            .from('suppliers')
            .select('business_name')
            .eq('id', workflowData.supplier_id)
            .limit(1)
            .maybeSingle();
          newSelections.supplier = supplier?.business_name || `External vendor ${workflowData.supplier_id}`;
        }

        // Fetch service vendor name
        if (workflowData.serv_vendor_id) {
          const { data: serviceVendor } = await supabase
            .from('vendor')
            .select('business_name')
            .eq('id', workflowData.serv_vendor_id)
            .limit(1)
            .maybeSingle();
          newSelections.serviceVendor = serviceVendor?.business_name || `Service Vendor ${workflowData.serv_vendor_id}`;
        }

        // // Fetch service rental name
        if (workflowData.service_rental_buy_id) {
          const { data: serviceRental } = await supabase
            .from('service_rental_buy')
            .select('*')
            .eq('id', workflowData.service_rental_buy_id)
            .limit(1)
            .maybeSingle();
          if (serviceRental) {
            const rentalKeys = Object.keys(serviceRental).filter(key => 
              key !== 'rental_type_id' && key !== 'created_at' && serviceRental[key]
            );
            newSelections.serviceRental = serviceRental?.business_name || `Service Rental ${workflowData.service_rental_buy_id}`;
          }
        }

        setSelections(newSelections);
      }
    };

    loadWorkflowSelections();
  }, [getWorkflowData, getWorkflowById, workflowId]);

  useEffect(() => {
    async function fetchEventTitle() {
      if (!workflowId) return;
      const workflowData = await getWorkflowById(workflowId);
      if (workflowData?.event_id) {
        const { data: event } = await supabase
          .from('events')
          .select('title')
          .eq('id', workflowData.event_id)
          .maybeSingle();
        setEventTitle(event?.title || "Event");
      }
    }
    fetchEventTitle();
  }, [workflowId, getWorkflowById]);

  // Calculate event progress based on completed tasks (excluding cancelled)
  const validTasks = eventTasks.filter(task => task.status !== "cancelled");
  const completedTasks = validTasks.filter(task => task.status === "completed").length;
  const eventProgressPercentage = validTasks.length > 0 ? (completedTasks / validTasks.length) * 100 : 0;

  // Calculate upcoming deadlines based on event tasks with a future due_date
  const now = new Date();
  const upcomingDeadlines = eventTasks.filter(task => task.due_date && new Date(task.due_date) > now).length;

  const { completed: selectionsMade, total: selectionTotal, percentage: overallProgressPercentage } =
    getWorkflowSelectionProgress(userType, selections);

  const stats = [
    {
      title: "Event Progress",
      value: `${completedTasks}/${validTasks.length}`,
      description: `${Math.round(eventProgressPercentage)}% Complete`,
      icon: TrendingUp,
    },
    {
      title: "Active Tasks",
      value: eventTasks.filter(task => task.status === "in_progress").length.toString(),
      description: "Currently in progress",
      icon: Clock,
    },
    {
      title: "Upcoming Deadlines",
      value: upcomingDeadlines.toString(),
      description: "Tasks with future due dates",
      icon: Calendar,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{"Workflow Dashboard - " + eventTitle}</h1>
          <p className="text-muted-foreground">
            {userType.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </p>
          {selections.theme ? (
            <p className="text-sm text-foreground/90 mt-1 max-w-2xl">
              Active theme: <span className="font-medium">{selections.theme}</span>. Tasks, progress, and resource picks on this page follow this workflow&apos;s event and theme.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Use Customize to set your theme and categories so vendor and service selections stay aligned with this event.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {onNewWorkflowForAnotherEvent && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNewWorkflowForAnotherEvent}
              title="Pick an event that does not have a workflow yet"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">New workflow for another event</span>
              <span className="sm:hidden">New workflow</span>
            </Button>
          )}
          {showChangeWorkflow && (
            <Button variant="outline" size="sm" onClick={onChangeWorkflow || (() => navigate('/dashboard/select-workflow'))}>
              Change Workflow
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCustomize}
            title="Edit workflow setup: role, theme, venue, services, and vendors"
          >
            <Settings className="h-4 w-4 mr-2" />
            Customize
          </Button>
          <Button size="sm" onClick={handleOpenTaskManager}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>Workflow selections completed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Selections Made</span>
              <span className="text-sm text-muted-foreground">{Math.round(overallProgressPercentage)}%</span>
            </div>
            <Progress value={overallProgressPercentage} className="w-full" />
            <div className="text-xs text-muted-foreground mt-2">
              {selectionsMade} of {selectionTotal} required selections completed
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Options */}
      <Card>
        <CardHeader>
          <CardTitle>Your Workflow Selections</CardTitle>
          <CardDescription>Options you selected during workflow setup</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(() => {
              const selectionCards: SelectionCard[] = [
                {
                  type: "theme",
                  title: "Event Theme",
                  description: "The selected theme for your event",
                  value: selections.theme || "Not selected",
                  icon: Palette,
                },
                {
                  type: "hospitality",
                  title: "Hospitality Provider",
                  description: "Accommodation and hospitality services",
                  value: selections.hospitality || "Not selected",
                  icon: Building,
                },
                {
                  type: "venue",
                  title: "Event Venue",
                  description: "Location where your event will take place",
                  value: selections.venue || "Not selected",
                  icon: Home,
                },
                {
                  type: "supplier",
                  title: "External vendor",
                  description: "External vendor for supplies and materials",
                  value: selections.supplier || "Not selected",
                  icon: Package,
                },
                {
                  type: "serviceVendor",
                  title: "Service Vendor",
                  description: "Professional services provider",
                  value: selections.serviceVendor || "Not selected",
                  icon: Users,
                },
                {
                  type: "serviceRental",
                  title: "Service Rental",
                  description: "Equipment and rental services",
                  value: selections.serviceRental || "Not selected",
                  icon: Wrench,
                }
              ];

              return selectionCards.map((card) => {
                const IconComponent = card.icon;
                
                return (
                  <Card key={card.type} className={`relative`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${'bg-primary text-primary-foreground'}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{card.title}</CardTitle>
                            <CardDescription>{card.description}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-foreground">
                          {card.value}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              });
            })()}
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
          <TabsTrigger value="timeline">Suggested Tasks</TabsTrigger>
          <TabsTrigger value="event-tasks">Event Tasks</TabsTrigger>
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
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(step.status)}>
                        {step.status.toUpperCase().replace("_", " ")}
                      </Badge>
                      <Button 
                        size="sm" 
                        onClick={handleOpenTaskManager}
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Event
                      </Button>
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

        <TabsContent value="event-tasks" className="space-y-4">
          <div className="space-y-4">
            {eventTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground mb-4">No tasks created yet</p>
                  <Button size="sm" onClick={handleOpenTaskManager}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Task
                  </Button>
                </CardContent>
              </Card>
            ) : (
              eventTasks.map((task, index) => {
                const StatusIcon = getStatusIcon(task.status || "not_started");
                return (
                  <Card key={task.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${getStatusColor(task.status || "not_started")}`}>
                            <StatusIcon className="h-4 w-4" />
                          </div>
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{task.title}</CardTitle>
                            {task.description && (
                              <CardDescription>{task.description}</CardDescription>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge 
                            variant="outline" 
                            className={getPriorityColor(task.priority || "medium")}
                          >
                            {(task.priority || "medium").toUpperCase()}
                          </Badge>
                          {task.due_date && (
                            <span className="text-sm text-muted-foreground">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(task.status || "not_started")}>
                          {(task.status || "not_started").toUpperCase().replace("_", " ")}
                        </Badge>
                        {task.estimated_hours && (
                          <span className="text-sm text-muted-foreground">
                            Est. {task.estimated_hours}h
                          </span>
                        )}
                      </div>
                    </CardContent>
                    {index < eventTasks.length - 1 && (
                      <div className="absolute left-8 bottom-0 w-0.5 h-6 bg-border transform translate-y-full" />
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
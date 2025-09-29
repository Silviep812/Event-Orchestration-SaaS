import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkflow } from "@/hooks/useWorkflow";
import { supabase } from "@/integrations/supabase/client";
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
  status: "planning" | "progress" | "review" | "complete";
  dueDate: string;
  assignee?: string;
  priority: "low" | "medium" | "high";
}

type SetupStep = "user-type" | "theme" | "hospitality" | "venue" | "services" | "suppliers" | "dashboard";

interface WorkflowDashboardProps {
  userType: string;
  selectedTheme: number;
  setCurrentStep?: (step: SetupStep) => void;
}

interface WorkflowSelections {
  theme: string;
  hospitality: string;
  venue: string;
  supplier: string;
  serviceVendor: string;
  serviceRental: string;
}

interface SelectionCard {
  type: string;
  title: string;
  description: string;
  value: string;
  icon: React.ComponentType<any>;
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

export const WorkflowDashboard = ({ userType, selectedTheme, setCurrentStep }: WorkflowDashboardProps) => {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [selections, setSelections] = useState<WorkflowSelections>({
    theme: '',
    hospitality: '',
    venue: '',
    supplier: '',
    serviceVendor: '',
    serviceRental: ''
  });
  const { getWorkflowData } = useWorkflow();
  const navigate = useNavigate();

  const handleCustomize = () => {
    if (setCurrentStep) {
      setCurrentStep("user-type");
    } else {
      navigate("/dashboard/workflow?step=1");
    }
  };

  useEffect(() => {
    setSteps(workflowSteps[userType] || []);
  }, [userType]);

  useEffect(() => {
    const loadWorkflowSelections = async () => {
      const workflowData = await getWorkflowData();
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
            .from('event_themes')
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
          newSelections.supplier = supplier?.business_name || `Supplier ${workflowData.supplier_id}`;
        }

        // Fetch service vendor name
        if (workflowData.serv_vendor_sup_id) {
          const { data: serviceVendor } = await supabase
            .from('serv_vendor_suppliers')
            .select('business_name')
            .eq('id', workflowData.serv_vendor_sup_id)
            .limit(1)
            .maybeSingle();
          newSelections.serviceVendor = serviceVendor?.business_name || `Service Vendor ${workflowData.serv_vendor_sup_id}`;
        }

        // // Fetch service rental name
        if (workflowData.serv_vendor_rent_id) {
          const { data: serviceRental } = await supabase
            .from('serv_vendor_rentals')
            .select('*')
            .eq('id', workflowData.serv_vendor_rent_id)
            .limit(1)
            .maybeSingle();
          if (serviceRental) {
            const rentalKeys = Object.keys(serviceRental).filter(key => 
              key !== 'rental_type_id' && key !== 'created_at' && serviceRental[key]
            );
            newSelections.serviceRental = serviceRental?.business_name || `Service Rental ${workflowData.serv_vendor_rent_id}`;
          }
        }

        setSelections(newSelections);
      }
    };

    loadWorkflowSelections();
  }, [getWorkflowData]);

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
          <Button variant="outline" size="sm" onClick={handleCustomize}>
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
                  title: "Supplier",
                  description: "Supplies and materials provider",
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
      </Tabs>
    </div>
  );
};
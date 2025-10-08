import { useState, useEffect } from "react";
import { WorkflowDashboard as WorkflowDashboardComponent } from "@/components/workflow/WorkflowDashboard";
import { useWorkflow } from "@/hooks/useWorkflow";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Workflow {
  id?: string;
  workflow_type_id?: number;
  theme_id?: number;
  event_id?: string;
  user_id: string;
  hospitality_id?: string;
  venue_id?: string;
  supplier_id?: string;
  serv_vendor_sup_id?: string;
  serv_vendor_rent_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
}

export default function WorkflowDashboard() {
  const { getAllWorkflows, getWorkflowById, loading } = useWorkflow();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [userType, setUserType] = useState<string>("");
  const [selectedTheme, setSelectedTheme] = useState<number | undefined>(undefined);
  const [events, setEvents] = useState<Record<string, Event>>({});
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(true);

  // Map workflow_type_id back to user type string
  const getUserTypeString = (typeId?: number): string => {
    switch (typeId) {
      case 1: return "social-organizer";
      case 2: return "professional-planner";
      case 3: return "hospitality-provider";
      case 4: return "venue-owner";
      case 5: return "host";
      default: return "";
    }
  };

  // Load all workflows on mount
  useEffect(() => {
    const loadWorkflows = async () => {
      setIsLoadingWorkflows(true);
      const allWorkflows = await getAllWorkflows();
      setWorkflows(allWorkflows);

      // If only one workflow, auto-select it
      if (allWorkflows.length === 1 && allWorkflows[0].id) {
        setSelectedWorkflowId(allWorkflows[0].id);
      }

      // Load event details for all workflows
      const eventIds = allWorkflows
        .map(w => w.event_id)
        .filter(Boolean) as string[];

      if (eventIds.length > 0) {
        const { data: eventsData } = await supabase
          .from('events')
          .select('id, title, description')
          .in('id', eventIds);

        if (eventsData) {
          const eventsMap: Record<string, Event> = {};
          eventsData.forEach(event => {
            eventsMap[event.id] = event;
          });
          setEvents(eventsMap);
        }
      }

      setIsLoadingWorkflows(false);
    };
    loadWorkflows();
  }, [getAllWorkflows]);

  // Load selected workflow data
  useEffect(() => {
    const loadSelectedWorkflow = async () => {
      if (!selectedWorkflowId) return;

      const data = await getWorkflowById(selectedWorkflowId);
      if (data) {
        setUserType(getUserTypeString(data.workflow_type_id));
        setSelectedTheme(data.theme_id || undefined);
      }
    };
    loadSelectedWorkflow();
  }, [selectedWorkflowId, getWorkflowById]);

  if (loading || isLoadingWorkflows) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your workflows...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <p className="text-muted-foreground">No workflows found. Please create a workflow first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If multiple workflows and none selected, show selection UI
  if (workflows.length > 1 && !selectedWorkflowId) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select a Workflow</CardTitle>
              <CardDescription>
                Choose which workflow you want to view
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {workflows.filter(w => w.id).map((workflow) => {
              const event = workflow.event_id ? events[workflow.event_id] : null;
              const workflowType = getUserTypeString(workflow.workflow_type_id);
              
              return (
                <Card
                  key={workflow.id!}
                  className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
                  onClick={() => setSelectedWorkflowId(workflow.id!)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {event?.title || "Untitled Event"}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {workflowType ? (
                            <span className="capitalize">
                              {workflowType.replace("-", " ")}
                            </span>
                          ) : (
                            "Workflow"
                          )}
                        </CardDescription>
                        {event?.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Show the dashboard for the selected workflow
  return (
    <WorkflowDashboardComponent 
      userType={userType}
      selectedTheme={selectedTheme}
      workflowId={selectedWorkflowId!}
    />
  );
}

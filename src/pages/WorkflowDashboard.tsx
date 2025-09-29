import { useState, useEffect } from "react";
import { WorkflowDashboard as WorkflowDashboardComponent } from "@/components/workflow/WorkflowDashboard";
import { useWorkflow } from "@/hooks/useWorkflow";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function WorkflowDashboard() {
  const { getWorkflowData, loading } = useWorkflow();
  const [userType, setUserType] = useState<string>("");
  const [selectedTheme, setSelectedTheme] = useState<number | undefined>(undefined);

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

  useEffect(() => {
    const loadWorkflowData = async () => {
      const data = await getWorkflowData();
      if (data) {
        setUserType(getUserTypeString(data.workflow_type_id));
        setSelectedTheme(data.theme_id || undefined);
      }
    };
    loadWorkflowData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your workflow dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <WorkflowDashboardComponent 
      userType={userType}
      selectedTheme={selectedTheme}
    />
  );
}

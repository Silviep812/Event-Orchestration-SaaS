import { useState } from "react";
import { WorkflowSelector } from "@/components/workflow/WorkflowSelector";
import { EventThemeSelector } from "@/components/workflow/EventThemeSelector";
import { WorkflowDashboard } from "@/components/workflow/WorkflowDashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

type SetupStep = "user-type" | "theme" | "dashboard";

export default function WorkflowSetup() {
  const [currentStep, setCurrentStep] = useState<SetupStep>("user-type");
  const [selectedUserType, setSelectedUserType] = useState<string>("");
  const [selectedTheme, setSelectedTheme] = useState<string>("");

  const handleUserTypeSelection = (userType: string) => {
    setSelectedUserType(userType);
    setCurrentStep("theme");
  };

  const handleThemeSelection = (theme: string) => {
    setSelectedTheme(theme);
    setCurrentStep("dashboard");
  };

  const handleBack = () => {
    if (currentStep === "theme") {
      setCurrentStep("user-type");
    } else if (currentStep === "dashboard") {
      setCurrentStep("theme");
    }
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case "user-type": return 33;
      case "theme": return 66;
      case "dashboard": return 100;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Progress Header */}
        {currentStep !== "dashboard" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {currentStep !== "user-type" && (
                    <Button variant="ghost" size="sm" onClick={handleBack}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                  )}
                  <div>
                    <CardTitle className="text-xl">
                      {currentStep === "user-type" && "Setup Your Workflow"}
                      {currentStep === "theme" && "Choose Event Theme"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Step {currentStep === "user-type" ? "1" : "2"} of 2
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedUserType && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="capitalize">
                        {selectedUserType.replace("-", " ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 mt-4">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getStepProgress()}%` }}
                />
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Step Content */}
        <div className="space-y-6">
          {currentStep === "user-type" && (
            <WorkflowSelector 
              onSelectUserType={handleUserTypeSelection}
              selectedUserType={selectedUserType}
            />
          )}

          {currentStep === "theme" && selectedUserType && (
            <EventThemeSelector 
              userType={selectedUserType}
              onSelectTheme={handleThemeSelection}
              selectedTheme={selectedTheme}
            />
          )}

          {currentStep === "dashboard" && selectedUserType && selectedTheme && (
            <WorkflowDashboard 
              userType={selectedUserType}
              selectedTheme={selectedTheme}
            />
          )}
        </div>
      </div>
    </div>
  );
}
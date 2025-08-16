import { useState } from "react";
import { WorkflowSelector } from "@/components/workflow/WorkflowSelector";
import { EventThemeSelector } from "@/components/workflow/EventThemeSelector";
import { HospitalitySelector } from "@/components/workflow/HospitalitySelector";
import { VenueSelector } from "@/components/workflow/VenueSelector";
import { VendorSelector } from "@/components/workflow/VendorSelector";
import { ServiceSelector } from "@/components/workflow/ServiceSelector";
import { SupplierSelector } from "@/components/workflow/SupplierSelector";
import { WorkflowDashboard } from "@/components/workflow/WorkflowDashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

type SetupStep = "user-type" | "theme" | "hospitality" | "venue" | "vendors" | "services" | "suppliers" | "dashboard";

export default function WorkflowSetup() {
  const [currentStep, setCurrentStep] = useState<SetupStep>("user-type");
  const [selectedUserType, setSelectedUserType] = useState<string>("");
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [selectedHospitality, setSelectedHospitality] = useState<any>(null);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const getNextStepForUserType = (userType: string, currentStep: SetupStep): SetupStep => {
    switch (userType) {
      case "venue-owner":
        if (currentStep === "user-type") return "theme";
        if (currentStep === "theme") return "vendors";
        if (currentStep === "vendors") return "services";
        if (currentStep === "services") return "suppliers";
        return "dashboard";
      
      case "hospitality-owner":
        if (currentStep === "user-type") return "theme";
        if (currentStep === "theme") return "venue";
        if (currentStep === "venue") return "vendors";
        if (currentStep === "vendors") return "services";
        if (currentStep === "services") return "suppliers";
        return "dashboard";
      
      default: // social-organizer, professional-planner
        if (currentStep === "user-type") return "theme";
        if (currentStep === "theme") return "hospitality";
        if (currentStep === "hospitality") return "venue";
        if (currentStep === "venue") return "vendors";
        if (currentStep === "vendors") return "services";
        if (currentStep === "services") return "suppliers";
        return "dashboard";
    }
  };

  const handleUserTypeSelection = (userType: string) => {
    setSelectedUserType(userType);
    setCurrentStep(getNextStepForUserType(userType, "user-type"));
  };

  const handleThemeSelection = (theme: string) => {
    setSelectedTheme(theme);
    setCurrentStep(getNextStepForUserType(selectedUserType, "theme"));
  };

  const handleHospitalitySelection = (hospitality: any) => {
    setSelectedHospitality(hospitality);
    setCurrentStep(getNextStepForUserType(selectedUserType, "hospitality"));
  };

  const handleVenueSelection = (venue: any) => {
    setSelectedVenue(venue);
    setCurrentStep(getNextStepForUserType(selectedUserType, "venue"));
  };

  const handleVendorSelection = (vendor: any) => {
    setSelectedVendor(vendor);
    setCurrentStep(getNextStepForUserType(selectedUserType, "vendors"));
  };

  const handleServiceSelection = (service: any) => {
    setSelectedService(service);
    setCurrentStep(getNextStepForUserType(selectedUserType, "services"));
  };

  const handleSupplierSelection = (supplier: any) => {
    setSelectedSupplier(supplier);
    setCurrentStep(getNextStepForUserType(selectedUserType, "suppliers"));
  };

  const handleBack = () => {
    if (currentStep === "theme") {
      setCurrentStep("user-type");
    } else if (currentStep === "hospitality") {
      setCurrentStep("theme");
    } else if (currentStep === "venue") {
      setCurrentStep("hospitality");
    } else if (currentStep === "vendors") {
      setCurrentStep("venue");
    } else if (currentStep === "services") {
      setCurrentStep("vendors");
    } else if (currentStep === "suppliers") {
      setCurrentStep("services");
    } else if (currentStep === "dashboard") {
      setCurrentStep("suppliers");
    }
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case "user-type": return 12.5;
      case "theme": return 25;
      case "hospitality": return 37.5;
      case "venue": return 50;
      case "vendors": return 62.5;
      case "services": return 75;
      case "suppliers": return 87.5;
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
                      {currentStep === "hospitality" && "Select Hospitality Services"}
                      {currentStep === "venue" && "Choose Venue Location"}
                      {currentStep === "vendors" && "Select Vendors"}
                      {currentStep === "services" && "Choose Services"}
                      {currentStep === "suppliers" && "Select Suppliers"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Step {
                        currentStep === "user-type" ? "1" : 
                        currentStep === "theme" ? "2" : 
                        currentStep === "hospitality" ? "3" : 
                        currentStep === "venue" ? "4" : 
                        currentStep === "vendors" ? "5" : 
                        currentStep === "services" ? "6" : 
                        currentStep === "suppliers" ? "7" : "8"
                      } of 8
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

          {currentStep === "hospitality" && selectedUserType && selectedTheme && selectedUserType !== "venue-owner" && selectedUserType !== "hospitality-owner" && (
            <HospitalitySelector 
              onSelectHospitality={handleHospitalitySelection}
              selectedHospitality={selectedHospitality}
            />
          )}

          {currentStep === "venue" && selectedUserType && selectedTheme && selectedUserType !== "venue-owner" && (
            <VenueSelector 
              onSelectVenue={handleVenueSelection}
              selectedVenue={selectedVenue}
            />
          )}

          {currentStep === "vendors" && selectedUserType && selectedTheme && selectedHospitality && selectedVenue && (
            <VendorSelector 
              onSelectVendor={handleVendorSelection}
              selectedVendor={selectedVendor}
            />
          )}

          {currentStep === "services" && selectedUserType && selectedTheme && selectedHospitality && selectedVenue && selectedVendor && (
            <ServiceSelector 
              onSelectService={handleServiceSelection}
              selectedService={selectedService}
            />
          )}

          {currentStep === "suppliers" && selectedUserType && selectedTheme && selectedHospitality && selectedVenue && selectedVendor && selectedService && (
            <SupplierSelector 
              onSelectSupplier={handleSupplierSelection}
              selectedSupplier={selectedSupplier}
            />
          )}

          {currentStep === "dashboard" && selectedUserType && selectedTheme && selectedHospitality && selectedVenue && selectedVendor && selectedService && selectedSupplier && (
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
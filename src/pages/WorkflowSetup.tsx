import { useState, useEffect } from "react";
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
import { useAuth } from "@/hooks/useAuth";
import { useWorkflow } from "@/hooks/useWorkflow";

type SetupStep = "user-type" | "theme" | "hospitality" | "venue" | "vendors" | "services" | "suppliers" | "dashboard";

export default function WorkflowSetup() {
  const { userRoles } = useAuth();
  const { saveWorkflowType, updateWorkflowSelections, loading } = useWorkflow();
  const [currentStep, setCurrentStep] = useState<SetupStep>("user-type");
  const [selectedUserType, setSelectedUserType] = useState<string>("");
  const [selectedTheme, setSelectedTheme] = useState<number | undefined>(undefined);
  const [selectedHospitality, setSelectedHospitality] = useState<string | undefined>(undefined);
  const [selectedVenue, setSelectedVenue] = useState<string | undefined>(undefined);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [selectedServiceVendor, setSelectedServiceVendor] = useState<string | null>(null);
  const [selectedServiceRental, setSelectedServiceRental] = useState<string | null>(null);

  // Auto-detect user type from Supabase roles
  useEffect(() => {
    if (userRoles.length > 0) {
      // Map Supabase roles to workflow user types
      if (userRoles.includes('venue_manager')) {
        setSelectedUserType('venue-owner');
      } else if (userRoles.includes('hospitality_manager')) {
        setSelectedUserType('hospitality-owner');
      } else if (userRoles.includes('event_manager') || userRoles.includes('admin')) {
        setSelectedUserType('professional-planner');
      } else {
        setSelectedUserType('social-organizer');
      }
      
      // Skip to theme selection since role is auto-detected
      setCurrentStep("theme");
    }
  }, [userRoles]);

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
        if (currentStep === "theme") return "hospitality";
        if (currentStep === "hospitality") return "venue";
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

  const handleUserTypeSelection = async (userType: string) => {
    setSelectedUserType(userType);
    
    // Save workflow type to database when Step 1 is completed
    const workflowId = await saveWorkflowType(userType);
    if (workflowId) {
      console.log('Workflow created with ID:', workflowId);
    }
    
    setCurrentStep(getNextStepForUserType(userType, "user-type"));
  };

  const handleThemeSelection = async (themeId: number, themeName: string) => {
    setSelectedTheme(themeId);
    
    // Save theme selection to workflow
    await updateWorkflowSelections({ theme_id: themeId });
    
    setCurrentStep(getNextStepForUserType(selectedUserType, "theme"));
  };

  const handleHospitalitySelection = async (hospitalityId: string) => {
    setSelectedHospitality(hospitalityId);
    
    // Save hospitality selection to workflow
    await updateWorkflowSelections({ hospitality_id: hospitalityId });
    
    setCurrentStep(getNextStepForUserType(selectedUserType, "hospitality"));
  };

  const handleVenueSelection = async (venueId: string) => {
    setSelectedVenue(venueId);
    
    // Save venue selection to workflow
    await updateWorkflowSelections({ venue_id: venueId });
    
    setCurrentStep(getNextStepForUserType(selectedUserType, "venue"));
  };

  const handleVendorSelection = async (vendorId: string) => {
    setSelectedVendor(vendorId);
    
    // Save vendor selection to workflow
    await updateWorkflowSelections({ supplier_id: vendorId });
    
    setCurrentStep(getNextStepForUserType(selectedUserType, "vendors"));
  };

  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const handleServiceVendorSelection = async (vendorId: string) => {
    setSelectedServiceVendor(vendorId);
    
    // Save service vendor selection to workflow
    await updateWorkflowSelections({ serv_vendor_sup_id: vendorId });
    
    // Move to next step if both selections are made or skip to suppliers step
    if (selectedServiceRental) {
      setCurrentStep(getNextStepForUserType(selectedUserType, "services"));
    }
  };

  const handleServiceRentalSelection = async (rentalId: string) => {
    setSelectedServiceRental(rentalId);
    
    // Save service rental selection to workflow
    await updateWorkflowSelections({ serv_vendor_rent_id: rentalId });
    
    // Move to next step if both selections are made or skip to suppliers step
    if (selectedServiceVendor) {
      setCurrentStep(getNextStepForUserType(selectedUserType, "services"));
    }
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

          {currentStep === "hospitality" && selectedUserType && selectedTheme && selectedUserType !== "venue-owner" && (
            <HospitalitySelector 
              onSelectHospitality={handleHospitalitySelection}
              selectedHospitality={selectedHospitality}
            />
          )}

          {currentStep === "venue" && selectedUserType && selectedTheme && (
            <VenueSelector 
              onSelectVenue={handleVenueSelection}
              selectedVenue={selectedVenue}
            />
          )}

          {currentStep === "vendors" && selectedUserType && selectedTheme && (
            <VendorSelector 
              onSelectVendor={handleVendorSelection}
              selectedVendor={selectedVendor}
            />
          )}

          {currentStep === "services" && selectedUserType && selectedTheme && selectedVendor && (
            <ServiceSelector 
              onSelectServiceVendor={handleServiceVendorSelection}
              onSelectServiceRental={handleServiceRentalSelection}
              selectedServiceVendor={selectedServiceVendor}
              selectedServiceRental={selectedServiceRental}
            />
          )}

          {currentStep === "suppliers" && selectedUserType && selectedTheme && (selectedServiceVendor || selectedServiceRental) && (
            <SupplierSelector 
              onSelectSupplier={handleSupplierSelection}
              selectedSupplier={selectedSupplier}
            />
          )}

          {currentStep === "dashboard" && selectedUserType && selectedTheme && selectedSupplier && (
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
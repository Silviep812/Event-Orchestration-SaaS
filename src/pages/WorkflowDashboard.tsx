import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { WorkflowDashboard as WorkflowDashboardComponent } from "@/components/workflow/WorkflowDashboard";
import { WorkflowSelector } from "@/components/workflow/WorkflowSelector";
import { EventSelector } from "@/components/workflow/EventSelector";
import { EventThemeSelector } from "@/components/workflow/EventThemeSelector";
import { HospitalitySelector } from "@/components/workflow/HospitalitySelector";
import { VenueSelector } from "@/components/workflow/VenueSelector";
import { ServiceSelector } from "@/components/workflow/ServiceSelector";
import { SupplierSelector } from "@/components/workflow/SupplierSelector";
import { useWorkflow } from "@/hooks/useWorkflow";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ArrowLeft, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  plannerSafeErrorToastDescription,
  plannerToolsCopy,
  workflowPlannerCopy,
} from "@/lib/nudges";

type SetupStep = "event" | "user-type" | "theme" | "hospitality" | "venue" | "services" | "suppliers" | "dashboard";

interface Workflow {
  id?: string;
  workflow_type_id?: number;
  theme_id?: number;
  event_id?: string;
  user_id: string;
  hospitality_id?: string;
  venue_id?: string;
  supplier_id?: string;
  serv_vendor_id?: string;
  service_rental_buy_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
}

export default function WorkflowDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userRoles, user } = useAuth();
  const { toast } = useToast();
  const { getAllWorkflows, getWorkflowById, saveWorkflowType, updateWorkflowSelections, loading } = useWorkflow();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [userType, setUserType] = useState<string>("");
  const [selectedTheme, setSelectedTheme] = useState<number | undefined>(undefined);
  const [events, setEvents] = useState<Record<string, Event>>({});
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(true);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
  const [currentStep, setCurrentStep] = useState<SetupStep | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | undefined>(undefined);
  const [selectedUserType, setSelectedUserType] = useState<string>("");
  const [selectedHospitality, setSelectedHospitality] = useState<string | undefined>(undefined);
  const [selectedVenue, setSelectedVenue] = useState<string | undefined>(undefined);
  const [selectedServiceVendor, setSelectedServiceVendor] = useState<string | null>(null);
  const [selectedServiceRental, setSelectedServiceRental] = useState<string | null>(null);
  /** External procurement vendors (`public.suppliers`); also synced to `events.external_supplier_ids`. */
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [workflowIdForEvent, setWorkflowIdForEvent] = useState<string | null>(null);
  /** When true, skip auto-jumping user-type → theme from roles (e.g. user pressed Back). */
  const [suppressUserTypeAutoAdvance, setSuppressUserTypeAutoAdvance] = useState(false);
  /** True when wizard was opened via Customize on an existing workflow — skip event/user-type and Back from theme exits to dashboard. */
  const [wizardOpenedFromCustomize, setWizardOpenedFromCustomize] = useState(false);
  /** Bumps EventSelector to refetch events vs workflows after starting "new workflow for another event". */
  const [eventSelectorRefreshKey, setEventSelectorRefreshKey] = useState(0);

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

  const refreshWorkflowsAndEvents = useCallback(async () => {
    const allWorkflows = await getAllWorkflows();
    setWorkflows(allWorkflows);

    const eventIds = allWorkflows.map((w) => w.event_id).filter(Boolean) as string[];
    if (eventIds.length > 0) {
      const { data: eventsData } = await supabase
        .from("events")
        .select("id, title, description")
        .in("id", eventIds);
      if (eventsData) {
        const eventsMap: Record<string, Event> = {};
        eventsData.forEach((event) => {
          eventsMap[event.id] = event;
        });
        setEvents(eventsMap);
      }
    }
    return allWorkflows;
  }, [getAllWorkflows]);

  // Load all workflows on mount
  useEffect(() => {
    const loadWorkflows = async () => {
      setIsLoadingWorkflows(true);
      const allWorkflows = await refreshWorkflowsAndEvents();
      if (allWorkflows.length === 1 && allWorkflows[0].id) {
        setSelectedWorkflowId(allWorkflows[0].id);
      }
      setIsLoadingWorkflows(false);
    };
    loadWorkflows();
  }, [refreshWorkflowsAndEvents]);

  // Check if editing existing workflow (coming from query params)
  useEffect(() => {
    const eventId = searchParams.get('eventId');
    if (eventId && !selectedWorkflowId && user?.id) {
      setSelectedEvent(eventId);
      setIsCreatingWorkflow(true);
      
      const loadExistingWorkflow = async () => {
        const { data: workflow } = await supabase
          .from('workflows')
          .select('*')
          .eq('event_id', eventId)
          .maybeSingle();
        
        if (workflow) {
          setWorkflowIdForEvent(workflow.id);
          
          if (workflow.workflow_type_id) {
            setSelectedUserType(getUserTypeString(workflow.workflow_type_id));
          }
          
          if (workflow.theme_id) setSelectedTheme(workflow.theme_id);
          if (workflow.hospitality_id) setSelectedHospitality(workflow.hospitality_id);
          if (workflow.venue_id) setSelectedVenue(workflow.venue_id);
          if (workflow.serv_vendor_id) setSelectedServiceVendor(workflow.serv_vendor_id);
          if (workflow.service_rental_buy_id) setSelectedServiceRental(workflow.service_rental_buy_id);
          const { data: evSup } = await supabase
            .from("events")
            .select("external_supplier_ids")
            .eq("id", eventId)
            .maybeSingle();
          const ext = evSup?.external_supplier_ids;
          setSelectedSupplierIds(
            Array.isArray(ext) && ext.length > 0
              ? ext
              : workflow.supplier_id
                ? [workflow.supplier_id]
                : [],
          );
        } else {
          const { data: created, error } = await supabase
            .from('workflows')
            .insert({ event_id: eventId, user_id: user.id })
            .select('id')
            .single();
          if (!error && created?.id) {
            setWorkflowIdForEvent(created.id);
          }
        }
      };
      
      loadExistingWorkflow();
      setSuppressUserTypeAutoAdvance(false);
      setCurrentStep("user-type");
    }
  }, [searchParams, selectedWorkflowId, user?.id]);

  // Auto-detect user type from Supabase roles (skip when user navigated Back to change role)
  useEffect(() => {
    if (
      userRoles.length > 0 &&
      currentStep === "user-type" &&
      !suppressUserTypeAutoAdvance
    ) {
      if (userRoles.includes('venue_manager')) {
        setSelectedUserType('venue-owner');
      } else if (userRoles.includes('hospitality_manager')) {
        setSelectedUserType('hospitality-provider');
      } else if (userRoles.includes('event_manager') || userRoles.includes('admin')) {
        setSelectedUserType('professional-planner');
      } else if (userRoles.includes('host')) {
        setSelectedUserType('host');
      } else {
        setSelectedUserType('social-organizer');
      }

      setCurrentStep("theme");
    }
  }, [userRoles, currentStep, suppressUserTypeAutoAdvance]);

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

  const handleEventSelection = async (eventId: string) => {
    setSelectedEvent(eventId);
    
    const { data: existingWorkflow } = await supabase
      .from('workflows')
      .select('id, supplier_id')
      .eq('event_id', eventId)
      .maybeSingle();

    const { data: eventRow } = await supabase
      .from('events')
      .select('external_supplier_ids')
      .eq('id', eventId)
      .maybeSingle();
    const fromEvent = eventRow?.external_supplier_ids;
    setSelectedSupplierIds(
      Array.isArray(fromEvent) && fromEvent.length > 0
        ? fromEvent
        : existingWorkflow?.supplier_id
          ? [existingWorkflow.supplier_id]
          : [],
    );
    
    if (!existingWorkflow) {
      const { data: newWorkflow } = await supabase
        .from('workflows')
        .insert({ 
          event_id: eventId, 
          user_id: user?.id 
        })
        .select('id')
        .single();
      
      if (newWorkflow) {
        setWorkflowIdForEvent(newWorkflow.id);
      }
    } else {
      setWorkflowIdForEvent(existingWorkflow.id);
    }
    
    setWizardOpenedFromCustomize(false);
    setSuppressUserTypeAutoAdvance(true);
    setCurrentStep("user-type");
  };

  const getNextStepForUserType = (userType: string, currentStep: SetupStep): SetupStep => {
    switch (userType) {
      case "venue-owner":
        if (currentStep === "event") return "user-type";
        if (currentStep === "user-type") return "theme";
        if (currentStep === "theme") return "services";
        if (currentStep === "services") return "suppliers";
        return "dashboard";
      
      case "hospitality-provider":
        if (currentStep === "event") return "user-type";
        if (currentStep === "user-type") return "theme";
        if (currentStep === "theme") return "hospitality";
        if (currentStep === "hospitality") return "venue";
        if (currentStep === "venue") return "services";
        if (currentStep === "services") return "suppliers";
        return "dashboard";
      
      default:
        if (currentStep === "event") return "user-type";
        if (currentStep === "user-type") return "theme";
        if (currentStep === "theme") return "hospitality";
        if (currentStep === "hospitality") return "venue";
        if (currentStep === "venue") return "services";
        if (currentStep === "services") return "suppliers";
        return "dashboard";
    }
  };

  const handleUserTypeSelection = async (userType: string) => {
    setSuppressUserTypeAutoAdvance(false);
    setSelectedUserType(userType);
    await saveWorkflowType(userType, workflowIdForEvent);
    setCurrentStep(getNextStepForUserType(userType, "user-type"));
  };

  const handleThemeSelection = async (themeId: number, themeName: string) => {
    setSelectedTheme(themeId);
    await updateWorkflowSelections({ theme_id: themeId }, workflowIdForEvent || undefined);
    setCurrentStep(getNextStepForUserType(selectedUserType, "theme"));
  };

  const handleHospitalitySelection = async (hospitalityId: string) => {
    setSelectedHospitality(hospitalityId);
    await updateWorkflowSelections({ hospitality_id: hospitalityId }, workflowIdForEvent || undefined);
    setCurrentStep(getNextStepForUserType(selectedUserType, "hospitality"));
  };

  const handleVenueSelection = async (venueId: string) => {
    setSelectedVenue(venueId);
    await updateWorkflowSelections({ venue_id: venueId }, workflowIdForEvent || undefined);
    setCurrentStep(getNextStepForUserType(selectedUserType, "venue"));
  };

  const handleServiceVendorSelection = async (vendorId: string) => {
    setSelectedServiceVendor(vendorId);
    const ok = await updateWorkflowSelections(
      { serv_vendor_id: vendorId },
      workflowIdForEvent || undefined
    );
    // One of vendor or rental is enough to continue (matches suppliers step gate).
    if (ok) {
      setCurrentStep(getNextStepForUserType(selectedUserType, "services"));
    }
  };

  const handleServiceRentalSelection = async (rentalId: string) => {
    setSelectedServiceRental(rentalId);
    const ok = await updateWorkflowSelections(
      { service_rental_buy_id: rentalId },
      workflowIdForEvent || undefined
    );
    if (ok) {
      setCurrentStep(getNextStepForUserType(selectedUserType, "services"));
    }
  };

  const handleSuppliersStepContinue = async () => {
    if (selectedSupplierIds.length === 0) {
      const skip = window.confirm(
        workflowPlannerCopy.skipExternalVendorsConfirm,
      );
      if (!skip) return;
    }
    const primaryId = selectedSupplierIds[0];
    const ok = await updateWorkflowSelections(
      selectedSupplierIds.length > 0 ? { supplier_id: primaryId } : { supplier_id: null },
      workflowIdForEvent || undefined
    );
    if (!ok) return;

    if (selectedEvent) {
      const { error: evErr } = await supabase
        .from("events")
        .update({
          external_supplier_ids: selectedSupplierIds.length ? selectedSupplierIds : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedEvent);
      if (evErr) {
        toast({
          title: "Could not save vendor list on event",
          description: plannerSafeErrorToastDescription(evErr, plannerToolsCopy.workflowVendorSaveFailed),
          variant: "destructive",
        });
        return;
      }
    }

    const next = getNextStepForUserType(selectedUserType, "suppliers");
    if (next !== "dashboard") {
      setCurrentStep(next);
      return;
    }

    // Land on the main workflow dashboard (full toolbar: Customize, New workflow, Change workflow).
    const wid = workflowIdForEvent;
    if (wid) {
      setSelectedWorkflowId(wid);
    }
    setIsCreatingWorkflow(false);
    setCurrentStep(null);
    setWizardOpenedFromCustomize(false);

    await refreshWorkflowsAndEvents();

    navigate("/dashboard/workflow-dashboard", { replace: true });
    toast({
      title: "Workflow setup complete",
      description: "Use Customize to change selections anytime.",
    });
  };

  const handleBack = () => {
    if (currentStep === "user-type") {
      setSuppressUserTypeAutoAdvance(false);
      setWizardOpenedFromCustomize(false);
      setCurrentStep("event");
    } else if (currentStep === "theme") {
      if (wizardOpenedFromCustomize) {
        setWizardOpenedFromCustomize(false);
        setIsCreatingWorkflow(false);
        setCurrentStep(null);
        return;
      }
      setSuppressUserTypeAutoAdvance(true);
      setCurrentStep("user-type");
    } else if (currentStep === "hospitality") setCurrentStep("theme");
    else if (currentStep === "venue") setCurrentStep("hospitality");
    else if (currentStep === "services") setCurrentStep("venue");
    else if (currentStep === "suppliers") setCurrentStep("services");
    else if (currentStep === "dashboard") setCurrentStep("suppliers");
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case "event": return 12.5;
      case "user-type": return 25;
      case "theme": return 37.5;
      case "hospitality": return 50;
      case "venue": return 62.5;
      case "services": return 75;
      case "suppliers": return 87.5;
      case "dashboard": return 100;
      default: return 0;
    }
  };

  /** Re-enter the setup wizard from the standalone workflow dashboard (Customize button). */
  const openCustomizeWizard = async () => {
    if (!selectedWorkflowId) {
      toast({
        title: "No workflow",
        description: "Select a workflow first.",
        variant: "destructive",
      });
      return;
    }
    const data = await getWorkflowById(selectedWorkflowId);
    if (!data) {
      toast({
        title: "Error",
        description: plannerToolsCopy.workflowLoadFailed,
        variant: "destructive",
      });
      return;
    }
    setWorkflowIdForEvent(data.id);
    if (data.event_id) setSelectedEvent(data.event_id);
    setSelectedUserType(getUserTypeString(data.workflow_type_id));
    if (data.theme_id != null) setSelectedTheme(data.theme_id);
    else setSelectedTheme(undefined);
    setSelectedHospitality(data.hospitality_id ?? undefined);
    setSelectedVenue(data.venue_id ?? undefined);
    setSelectedServiceVendor(data.serv_vendor_id ?? null);
    setSelectedServiceRental(data.service_rental_buy_id ?? null);
    if (data.event_id) {
      const { data: evSup } = await supabase
        .from("events")
        .select("external_supplier_ids")
        .eq("id", data.event_id)
        .maybeSingle();
      const ext = evSup?.external_supplier_ids;
      setSelectedSupplierIds(
        Array.isArray(ext) && ext.length > 0
          ? ext
          : data.supplier_id
            ? [data.supplier_id]
            : [],
      );
    } else {
      setSelectedSupplierIds(data.supplier_id ? [data.supplier_id] : []);
    }
    setSuppressUserTypeAutoAdvance(false);
    setIsCreatingWorkflow(true);

    const role = getUserTypeString(data.workflow_type_id);
    setSelectedUserType(role || "");
    if (role) {
      setWizardOpenedFromCustomize(true);
      setCurrentStep("theme");
    } else {
      setWizardOpenedFromCustomize(false);
      setSuppressUserTypeAutoAdvance(true);
      setCurrentStep("user-type");
    }

    navigate("/dashboard/workflow-dashboard", { replace: true });
  };

  /** Begin wizard for an event that does not yet have a workflow (EventSelector hides events that already have one). */
  const startNewWorkflowForAnotherEvent = async () => {
    await refreshWorkflowsAndEvents();
    setEventSelectorRefreshKey((k) => k + 1);
    setWizardOpenedFromCustomize(false);
    setSuppressUserTypeAutoAdvance(false);
    setSelectedWorkflowId(null);
    setUserType("");
    setSelectedEvent(undefined);
    setSelectedUserType("");
    setSelectedTheme(undefined);
    setSelectedHospitality(undefined);
    setSelectedVenue(undefined);
    setSelectedServiceVendor(null);
    setSelectedServiceRental(null);
    setSelectedSupplierIds([]);
    setWorkflowIdForEvent(null);
    setCurrentStep("event");
    setIsCreatingWorkflow(true);
    navigate("/dashboard/workflow-dashboard", { replace: true });
  };

  if (workflows.length === 0 || isCreatingWorkflow) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {currentStep !== "dashboard" && currentStep !== null && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {currentStep !== "event" && (
                      <Button variant="ghost" size="sm" onClick={handleBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                    )}
                    <div>
                      <CardTitle className="text-xl">
                        {currentStep === "event" && "Select Your Event"}
                        {currentStep === "user-type" && "Setup Your Workflow"}
                        {currentStep === "theme" && "Manage Event — theme & category"}
                        {currentStep === "hospitality" && "Select Hospitality Services"}
                        {currentStep === "venue" && "Choose Venue Location"}
                        {currentStep === "services" && "Choose Services"}
                        {currentStep === "suppliers" && "Select External Vendors"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Step {
                          currentStep === "event" ? "1" :
                          currentStep === "user-type" ? "2" : 
                          currentStep === "theme" ? "3" : 
                          currentStep === "hospitality" ? "4" : 
                          currentStep === "venue" ? "5" : 
                          currentStep === "services" ? "6" :
                          currentStep === "suppliers" ? "7" : "8"
                        } of 8
                      </p>
                      {currentStep !== "event" && (
                        <p className="text-xs text-muted-foreground mt-2 max-w-2xl">
                          Each step scopes this workflow to your event, then theme and categories so resource and external vendor choices stay aligned. Use Customize on the dashboard to change selections anytime.
                        </p>
                      )}
                    </div>
                  </div>
                  {selectedUserType && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="capitalize">
                        {selectedUserType.replace("-", " ")}
                      </span>
                    </div>
                  )}
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

          {currentStep === null && (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 p-6">
                <p className="text-muted-foreground">No workflows found.</p>
                <Button onClick={() => setCurrentStep("event")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            {currentStep === "event" && (
              <EventSelector 
                onSelectEvent={handleEventSelection}
                selectedEvent={selectedEvent}
                refreshKey={eventSelectorRefreshKey}
              />
            )}

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
                eventId={selectedEvent}
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

            {currentStep === "services" && selectedUserType && selectedTheme && (
              <ServiceSelector 
                onSelectServiceVendor={handleServiceVendorSelection}
                onSelectServiceRental={handleServiceRentalSelection}
                selectedServiceVendor={selectedServiceVendor}
                selectedServiceRental={selectedServiceRental}
              />
            )}

            {currentStep === "suppliers" && selectedUserType && selectedTheme && (
              <SupplierSelector
                selectedSupplierIds={selectedSupplierIds}
                onSelectedIdsChange={setSelectedSupplierIds}
                onContinue={() => void handleSuppliersStepContinue()}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // If multiple workflows and none selected, show selection UI
  if (workflows.length > 1 && !selectedWorkflowId) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle>Select a Workflow</CardTitle>
                <CardDescription>
                  Each workflow is tied to one event. To add another workflow, create a new event, then use &quot;New workflow for another event&quot;.
                </CardDescription>
              </div>
              <Button size="sm" onClick={startNewWorkflowForAnotherEvent} className="shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">New workflow for another event</span>
                <span className="sm:hidden">New workflow</span>
              </Button>
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
    <div className="min-h-screen bg-background">
      <WorkflowDashboardComponent 
        userType={userType}
        selectedTheme={selectedTheme}
        workflowId={selectedWorkflowId!}
        onCustomizeWorkflow={openCustomizeWizard}
        onChangeWorkflow={async () => {
          await refreshWorkflowsAndEvents();
          setSelectedWorkflowId(null);
        }}
        showChangeWorkflow={workflows.length > 1}
        onNewWorkflowForAnotherEvent={startNewWorkflowForAnotherEvent}
      />
    </div>
  );
}

import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useGAPageViews } from "@/hooks/useGAPageViews";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardHome = lazy(() => import("./pages/DashboardHome"));
const WorkflowDashboard = lazy(() => import("./pages/WorkflowDashboard"));
const ThemesDirectory = lazy(() => import("./pages/ThemesDirectory"));
const ProjectManagement = lazy(() => import("./pages/ProjectManagement"));
const PlanningAssets = lazy(() => import("./components/PlanningAssets"));
const EditTemplate = lazy(() => import("./pages/EditTemplate"));
const Analytics = lazy(() => import("./components/Analytics"));
const EventCalendar = lazy(() => import("./components/EventCalendar"));
const ManageEventPage = lazy(() => import("./pages/ManageEvent"));
const CreateEvent = lazy(() => import("./pages/CreateEvent"));
const Reports = lazy(() => import("./pages/Reports"));
const Collaborate = lazy(() => import("./pages/Collaborate"));
const Comments = lazy(() => import("./pages/Comments"));
const TrackProgress = lazy(() => import("./pages/TrackProgress"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BookingsDirectory = lazy(() => import("./pages/BookingsDirectory"));
const VenueDirectory = lazy(() => import("./pages/VenueDirectory"));
const HospitalityDirectory = lazy(() => import("./pages/HospitalityDirectory"));
const VendorServiceDirectory = lazy(() => import("./pages/VendorServiceDirectory"));
const ServiceVendorDirectory = lazy(() => import("./pages/ServiceVendorDirectory"));
const TransportationDirectory = lazy(() => import("./pages/TransportationDirectory"));
const EntertainmentDirectory = lazy(() => import("./pages/EntertainmentDirectory"));
const SupplierDirectory = lazy(() => import("./pages/SupplierDirectory"));
const Profile = lazy(() => import("./pages/Profile"));
const TaskTimeline = lazy(() => import("./pages/TaskTimeline"));
const ResourceMap = lazy(() => import("./pages/ResourceMap"));
const MarketingCampaign = lazy(() => import("./pages/MarketingCampaign"));
const MarketingCreatives = lazy(() => import("./pages/MarketingCreatives"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const PreviewEventPlan = lazy(() => import("./pages/PreviewEventPlan"));
const Invoices = lazy(() => import("./pages/Invoices"));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

function AnalyticsTracker() {
  useGAPageViews();
  return null;
}

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnalyticsTracker />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/contact" element={<Navigate to="/" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route path="/marketing-creatives" element={<MarketingCreatives />} />
            <Route path="/dashboard" element={<Dashboard />}>
              <Route index element={<DashboardHome />} />
              <Route path="workflow-dashboard" element={<WorkflowDashboard />} />
              <Route path="themes" element={<ThemesDirectory />} />
              <Route path="project-management" element={<ProjectManagement />} />
              {/* Short URL → PM Collaborator workspace (change requests live under Role → Task → Change requests) */}
              <Route
                path="change-management"
                element={<Navigate to="/dashboard/project-management?tab=collaborator" replace />}
              />
              <Route path="planning-assets" element={<PlanningAssets />} />
              <Route path="planning-assets/:templateId" element={<EditTemplate />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="calendar" element={<EventCalendar />} />
              <Route path="task-timeline" element={<TaskTimeline />} />
              <Route path="resource-map" element={<ResourceMap />} />
              <Route path="create-event" element={<CreateEvent />} />
              <Route path="event-summary" element={<Navigate to="/dashboard/manage-event" replace />} />
              <Route path="manage-event" element={<ManageEventPage />} />
              <Route path="collaborate" element={<Collaborate />} />
              <Route path="track-progress" element={<TrackProgress />} />
              <Route path="reports" element={<Reports />} />
              <Route path="preview-event-plan" element={<PreviewEventPlan />} />
              <Route path="marketing-campaign" element={<MarketingCampaign />} />
              <Route path="notification" element={<Notifications />} />
              <Route path="comments" element={<Comments />} />
              <Route path="bookings" element={<BookingsDirectory />} />
              <Route path="venue" element={<VenueDirectory />} />
              <Route path="hospitality" element={<HospitalityDirectory />} />
              <Route path="vendor-service" element={<VendorServiceDirectory />} />
              <Route path="service-vendor" element={<ServiceVendorDirectory />} />
              <Route path="transportation" element={<TransportationDirectory />} />
              <Route path="entertainment" element={<EntertainmentDirectory />} />
              <Route path="supplier" element={<SupplierDirectory />} />
              <Route path="profile" element={<Profile />} />
              <Route path="invoices" element={<Invoices />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
);

export default App;

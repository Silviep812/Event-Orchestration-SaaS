import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import WorkflowDashboard from "./pages/WorkflowDashboard";
import ThemesDirectory from "./pages/ThemesDirectory";
import ProjectManagement from "./pages/ProjectManagement";
import PlanningAssets from "./components/PlanningAssets";
import EditTemplate from "./pages/EditTemplate";
import Analytics from "./components/Analytics";
import EventCalendar from "./components/EventCalendar";
import ManageEventPage from "./pages/ManageEvent";
import CreateEvent from "./pages/CreateEvent";
import Reports from "./pages/Reports";
import Collaborate from "./pages/Collaborate";
import Comments from "./pages/Comments";
import TrackProgress from "./pages/TrackProgress";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import BookingsDirectory from "./pages/BookingsDirectory";
import VenueDirectory from "./pages/VenueDirectory";
import HospitalityDirectory from "./pages/HospitalityDirectory";
import VendorServiceDirectory from "./pages/VendorServiceDirectory";
import ServiceVendorDirectory from "./pages/ServiceVendorDirectory";
import TransportationDirectory from "./pages/TransportationDirectory";
import EntertainmentDirectory from "./pages/EntertainmentDirectory";
import SupplierDirectory from "./pages/SupplierDirectory";
import Profile from "./pages/Profile";
import TaskTimeline from "./pages/TaskTimeline";
import ResourceMap from "./pages/ResourceMap";
import MarketingCampaign from "./pages/MarketingCampaign";

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/contact" element={<Navigate to="/" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />}>
              <Route index element={<DashboardHome />} />
              <Route path="workflow-dashboard" element={<WorkflowDashboard />} />
              <Route path="themes" element={<ThemesDirectory />} />
              <Route path="project-management" element={<ProjectManagement />} />
              {/* Short URL → PM Change Management tab (change requests list + link to Manage Event log) */}
              <Route
                path="change-management"
                element={<Navigate to="/dashboard/project-management?tab=change-management" replace />}
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
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
);

export default App;

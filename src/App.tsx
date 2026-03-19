import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

const ComingSoon = lazy(() => import("./pages/ComingSoon"));
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
const TrackProgress = lazy(() => import("./pages/TrackProgress"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Comments = lazy(() => import("./pages/Comments"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BookingsDirectory = lazy(() => import("./pages/BookingsDirectory"));
const VenueDirectory = lazy(() => import("./pages/VenueDirectory"));
const HospitalityDirectory = lazy(() => import("./pages/HospitalityDirectory"));
const VendorServiceDirectory = lazy(() => import("./pages/VendorServiceDirectory"));
const ServiceVendorDirectory = lazy(() => import("./pages/ServiceVendorDirectory"));
const TransportationDirectory = lazy(() => import("./pages/TransportationDirectory"));
const EntertainmentDirectory = lazy(() => import("./pages/EntertainmentDirectory"));
const SupplierDirectory = lazy(() => import("./pages/SupplierDirectory"));
const VendorsDirectory = lazy(() => import("./pages/VendorsDirectory"));
const Profile = lazy(() => import("./pages/Profile"));
const Contact = lazy(() => import("./pages/Contact"));
const ChangeRequests = lazy(() => import("./pages/ChangeRequests"));
const ChangeRequestDetail = lazy(() => import("./pages/ChangeRequestDetail"));
const Marketing = lazy(() => import("./pages/Marketing"));
const ResourceExplorer = lazy(() => import("./pages/ResourceExplorer"));

const queryClient = new QueryClient();

const withAuthProvider = (element: JSX.Element) => <AuthProvider>{element}</AuthProvider>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<ComingSoon />} />
            <Route path="/auth" element={withAuthProvider(<Auth />)} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/dashboard" element={withAuthProvider(<Dashboard />)}>
              <Route index element={<DashboardHome />} />
              <Route path="workflow-dashboard" element={<WorkflowDashboard />} />
              <Route path="themes" element={<ThemesDirectory />} />
              <Route path="project-management" element={<ProjectManagement />} />
              <Route path="planning-assets" element={<PlanningAssets />} />
              <Route path="planning-assets/:templateId" element={<EditTemplate />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="calendar" element={<EventCalendar />} />
              <Route path="create-event" element={<CreateEvent />} />
              <Route path="manage-event" element={<ManageEventPage />} />
              <Route path="collaborate" element={<Collaborate />} />
              <Route path="track-progress" element={<TrackProgress />} />
              <Route path="reports" element={<Reports />} />
              <Route path="change-requests" element={<ChangeRequests />} />
              <Route path="change-requests/:id" element={<ChangeRequestDetail />} />
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
              <Route path="vendors" element={<VendorsDirectory />} />
              <Route path="marketing" element={<Marketing />} />
              <Route path="resource-explorer" element={<ResourceExplorer />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import WorkflowSetup from "./pages/WorkflowSetup";
import ThemesDirectory from "./pages/ThemesDirectory";
import ProjectManagement from "./pages/ProjectManagement";
import PlanningAssets from "./components/PlanningAssets";
import Analytics from "./components/Analytics";
import EventCalendar from "./components/EventCalendar";
import ManageEventPage from "./pages/ManageEvent";
import CreateEvent from "./pages/CreateEvent";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />}>
              <Route index element={<DashboardHome />} />
              <Route path="workflow" element={<WorkflowSetup />} />
              <Route path="themes" element={<ThemesDirectory />} />
              <Route path="project-management" element={<ProjectManagement />} />
              <Route path="planning-assets" element={<PlanningAssets />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="calendar" element={<EventCalendar />} />
              <Route path="create-event" element={<CreateEvent />} />
              <Route path="manage-event" element={<ManageEventPage />} />
              <Route path="collaborate" element={<div>Collaborate Page</div>} />
              <Route path="track-progress" element={<div>Track Progress Page</div>} />
              <Route path="reports" element={<Reports />} />
              <Route path="notification" element={<div>Notification Page</div>} />
              <Route path="comments" element={<div>Comments Page</div>} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

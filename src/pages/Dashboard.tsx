import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { profileNeedsOnboarding } from "@/lib/profileOnboardingGate";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [onboardingGateReady, setOnboardingGateReady] = useState(false);

  useEffect(() => {
    setOnboardingGateReady(false);
    if (!user?.id) return;
    let cancelled = false;
    void (async () => {
      const needs = await profileNeedsOnboarding(supabase);
      if (cancelled) return;
      if (needs) {
        navigate("/onboarding", { replace: true });
        return;
      }
      setOnboardingGateReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, navigate]);

  return (
    <ProtectedRoute>
      {onboardingGateReady ? (
        <SidebarProvider defaultOpen={true}>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <DashboardHeader />
              <main className="flex-1 p-6 overflow-auto [&_.container]:max-w-none [&_.container]:w-full">
                <Outlet />
              </main>
            </div>
          </div>
        </SidebarProvider>
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" aria-hidden />
        </div>
      )}
    </ProtectedRoute>
  );
};

export default Dashboard;
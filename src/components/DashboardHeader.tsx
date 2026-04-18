import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvatarWithBrandFallback } from "@/components/AvatarWithBrandFallback";
import { IEP_LOGO_COLORED } from "@/lib/brandAssets";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut, User, Bell, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function DashboardHeader() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userProfile, setUserProfile] = useState<{ avatar_url?: string; display_name?: string } | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url, display_name')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setUserProfile(data);
        }
      }
    };

    loadUserProfile();

    // Listen for avatar/profile update events
    const handleProfileUpdate = () => {
      loadUserProfile();
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setUnreadNotificationCount(0);
      return;
    }

    const refreshUnread = async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.warn("DashboardHeader: unread notification count", error.message);
        return;
      }
      setUnreadNotificationCount(count ?? 0);
    };

    void refreshUnread();

    const channel = supabase
      .channel(`dashboard-header-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          void refreshUnread();
        }
      )
      .subscribe();

    const onMarkedRead = () => {
      void refreshUnread();
    };
    window.addEventListener("notificationsMarkedRead", onMarkedRead);

    return () => {
      window.removeEventListener("notificationsMarkedRead", onMarkedRead);
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      navigate('/');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserDisplayName = () => {
    if (userProfile?.display_name) return userProfile.display_name;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3 lg:gap-4">
        <SidebarTrigger className="h-9 w-9 hover:bg-accent text-foreground [&_svg]:h-5 [&_svg]:w-5" />
        <div className="flex items-center gap-4 lg:gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" aria-label="IEP Dashboard">
            <img
              src={IEP_LOGO_COLORED}
              alt="IEP logo"
              className="h-8 w-auto object-contain"
            />
            <span className="hidden sm:block text-xl font-bold text-primary">IEP</span>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* Date and time */}
        <div className="hidden xl:flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <div className="flex flex-col items-end">
            <span className="font-medium">{formatDate(currentDate)}</span>
            <span className="text-xs">{formatTime(currentDate)}</span>
          </div>
        </div>
        
        {/* Welcome message */}
        <div className="hidden md:block text-sm">
          <div className="text-muted-foreground">Welcome back!</div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="relative shrink-0"
          aria-label={
            unreadNotificationCount > 0
              ? `Notifications, ${unreadNotificationCount} unread`
              : "Notifications"
          }
          onClick={() => navigate("/dashboard/notification")}
        >
          <Bell className="h-5 w-5" />
          {unreadNotificationCount > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-[10px] leading-none flex items-center justify-center rounded-full p-0"
            >
              {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
            </Badge>
          ) : null}
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-10">
              <AvatarWithBrandFallback
                className="h-8 w-8"
                src={userProfile?.avatar_url}
                alt=""
                displayName={getUserDisplayName()}
                fallbackClassName="text-xs"
              />
              <span className="hidden md:block text-sm font-medium">{getUserDisplayName()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
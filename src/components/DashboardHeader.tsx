import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Home, LogOut, Settings, User, Bell, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function DashboardHeader() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3 lg:gap-4">
        <SidebarTrigger />
        <div className="flex items-center gap-4 lg:gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" aria-label="IEP Dashboard">
            <img 
              src="/lovable-uploads/e8e18250-fa27-4ae4-a4bc-867e063bcfd1.png" 
              alt="IEP logo" 
              className="h-8 w-8 object-contain" 
            />
            <span className="hidden sm:block text-xl font-bold text-primary">IEP</span>
          </Link>
          
          {/* Navigation breadcrumb */}
          <nav className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Home className="h-4 w-4" />
              <span className="hidden xl:block">Home</span>
            </Link>
            <span>/</span>
            <span>Dashboard</span>
          </nav>
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
          <div className="text-muted-foreground">Welcome back,</div>
          <div className="font-semibold text-foreground text-base">{getUserDisplayName()}</div>
        </div>
        
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full"></span>
        </Button>
        
        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-10">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium">{getUserDisplayName()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
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
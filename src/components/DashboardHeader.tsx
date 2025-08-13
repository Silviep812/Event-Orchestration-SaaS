import { useState } from "react";
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
import { Home, LogOut, Settings, User, Bell } from "lucide-react";
import { Link } from "react-router-dom";

export function DashboardHeader() {
  const [user] = useState({ name: "John Doe", email: "john@example.com" });

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
        {/* Welcome message */}
        <span className="hidden lg:block text-sm text-muted-foreground">
          Welcome to Ida Event Partners
        </span>
        
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
                <AvatarFallback className="text-xs">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium">{user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
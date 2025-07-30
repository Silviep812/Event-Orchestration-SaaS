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
import { Home, LogOut, Settings, User } from "lucide-react";
import { Link } from "react-router-dom";

export function DashboardHeader() {
  const [user] = useState({ name: "John Doe", email: "john@example.com" });

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex items-center gap-6">
          <div className="text-xl font-bold text-primary">IEP</div>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <span className="text-sm text-muted-foreground">Welcome to Ida Event Partners</span>
          </nav>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden sm:block text-sm text-muted-foreground">
          Welcome to Ida Event Partners
        </span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback>
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block">{user.name}</span>
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
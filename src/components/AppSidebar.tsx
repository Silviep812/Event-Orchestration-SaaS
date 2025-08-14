import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Calendar,
  Settings,
  Users,
  BarChart3,
  FileText,
  MessageSquare,
  TrendingUp,
  Plus,
  Bell,
  Home,
  Workflow,
  Palette,
  CheckSquare,
  Package,
  CalendarDays
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Workflow Setup",
    url: "/dashboard/workflow",
    icon: Workflow,
  },
  {
    title: "Themes Directory",
    url: "/dashboard/themes",
    icon: Palette,
  },
  {
    title: "Project Management",
    url: "/dashboard/project-management",
    icon: CheckSquare,
  },
  {
    title: "Planning Assets",
    url: "/dashboard/planning-assets",
    icon: Package,
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Calendar",
    url: "/dashboard/calendar",
    icon: CalendarDays,
  },
  {
    title: "Create Event",
    url: "/dashboard/create-event",
    icon: Plus,
  },
  {
    title: "Manage Event",
    url: "/dashboard/manage-event",
    icon: Calendar,
  },
  {
    title: "Collaborate",
    url: "/dashboard/collaborate",
    icon: Users,
  },
  {
    title: "Track Progress",
    url: "/dashboard/track-progress",
    icon: TrendingUp,
  },
  {
    title: "Generate Reports",
    url: "/dashboard/reports",
    icon: FileText,
  },
  {
    title: "Notification",
    url: "/dashboard/notification",
    icon: Bell,
  },
  {
    title: "Comments",
    url: "/dashboard/comments",
    icon: MessageSquare,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const isExpanded = menuItems.some((item) => isActive(item.url));

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Event Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => getNavClass({ isActive })}
                    >
                      <item.icon className={`h-4 w-4 ${collapsed ? '' : 'mr-3'}`} />
                      {!collapsed && (
                        <span className="text-sm">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
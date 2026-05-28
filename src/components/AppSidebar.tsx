import { NavLink, useLocation } from "react-router-dom";
import {
  Calendar,
  Settings,
  Users,
  BarChart3,
  FileText,
  TrendingUp,
  Plus,
  Bell,
  Home,
  Workflow,
  Palette,
  CheckSquare,
  Package,
  CalendarDays,
  Building2,
  Coffee,
  ShoppingCart,
  Truck,
  Car,
  MapPin,
  Megaphone,
  MessageSquare,
  Receipt,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useMemo } from "react";
import { useCreateEventEntryPath } from "@/hooks/useCreateEventEntryPath";
import { useOwnsActiveEvents } from "@/hooks/useOwnsActiveEvents";
import { CREATE_EVENT_PATH_NEW_PLANNER } from "@/lib/createEventEntryPath";
import { cmSidebarFooterText } from "@/lib/cmEnv";
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

const menuGroups = [
  {
    title: "Overview",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
        color: "text-blue-600",
        hoverColor: "hover:bg-blue-50",
      },
      {
        title: "Marketing campaign",
        url: "/dashboard/marketing-campaign",
        icon: Megaphone,
        color: "text-blue-600",
        hoverColor: "hover:bg-blue-50",
        adminOnly: true,
      },
    ]
  },
  {
    title: "Event Planning",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    items: [
      {
        title: "Create event",
        url: "/dashboard/create-event",
        icon: Plus,
        color: "text-purple-600",
        hoverColor: "hover:bg-purple-50"
      },
      {
        title: "Manage Event",
        url: "/dashboard/manage-event",
        icon: Calendar,
        color: "text-purple-600",
        hoverColor: "hover:bg-purple-50"
      },
      {
        title: "Calendar",
        url: "/dashboard/calendar",
        icon: CalendarDays,
        color: "text-purple-600",
        hoverColor: "hover:bg-purple-50"
      }
    ]
  },
  {
    title: "Project Tools",
    color: "text-green-600",
    bgColor: "bg-green-50",
    items: [
      {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: BarChart3,
        color: "text-green-600",
        hoverColor: "hover:bg-green-50"
      },
      {
        title: "Workflow",
        url: "/dashboard/workflow-dashboard",
        icon: Workflow,
        color: "text-green-600",
        hoverColor: "hover:bg-green-50"
      },
      {
        title: "Change Request",
        url: "/dashboard/project-management?tab=change-request",
        icon: FileText,
        color: "text-green-600",
        hoverColor: "hover:bg-green-50",
      },
      {
        title: "Project Management",
        url: "/dashboard/project-management",
        icon: CheckSquare,
        color: "text-green-600",
        hoverColor: "hover:bg-green-50"
      },
      {
        title: "Track Progress",
        url: "/dashboard/track-progress",
        icon: TrendingUp,
        color: "text-green-600",
        hoverColor: "hover:bg-green-50"
      },
      {
        title: "Event Timeline",
        url: "/dashboard/task-timeline",
        icon: BarChart3,
        color: "text-green-600",
        hoverColor: "hover:bg-green-50"
      }
    ]
  },
  {
    title: "Analytics & Reports",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    items: [
      {
        title: "Preview Event Plan",
        url: "/dashboard/preview-event-plan",
        icon: FileText,
        color: "text-teal-600",
        hoverColor: "hover:bg-teal-50",
        ownerOnly: true,
      },
      {
        title: "Event Plan Report",
        url: "/dashboard/reports?tab=event-plan",
        icon: FileText,
        color: "text-teal-600",
        hoverColor: "hover:bg-teal-50",
        ownerOnly: true,
      },
      {
        title: "Insights",
        url: "/dashboard/reports?tab=insights",
        icon: BarChart3,
        color: "text-teal-600",
        hoverColor: "hover:bg-teal-50"
      },
      {
        title: "Change Request Report",
        url: "/dashboard/reports?tab=change-requests",
        icon: FileText,
        color: "text-teal-600",
        hoverColor: "hover:bg-teal-50"
      }
    ]
  },
  {
    title: "Resources",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    items: [
      {
        title: "Planning Assets",
        url: "/dashboard/planning-assets",
        icon: Package,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50"
      },
      {
        title: "Themes",
        url: "/dashboard/themes",
        icon: Palette,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50"
      },
      {
        title: "Bookings",
        url: "/dashboard/bookings",
        icon: Calendar,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50"
      },
      {
        title: "Venue Directory",
        url: "/dashboard/venue",
        icon: Building2,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50"
      },
      {
        title: "Hospitality Directory",
        url: "/dashboard/hospitality",
        icon: Coffee,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50"
      },
      {
        title: "Service Rental Directory",
        url: "/dashboard/vendor-service",
        icon: ShoppingCart,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50"
      },
      {
        title: "Service Vendor Directory",
        url: "/dashboard/service-vendor",
        icon: Truck,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50"
      },
      {
        title: "Transportation Directory",
        url: "/dashboard/transportation",
        icon: Car,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50"
      },
      {
        title: "Entertainment Directory",
        url: "/dashboard/entertainment",
        icon: Users,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50"
      },
      {
        title: "External Vendor Directory",
        url: "/dashboard/supplier",
        icon: Package,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50"
      },
      {
        title: "Resource map",
        url: "/dashboard/resource-map",
        icon: MapPin,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50"
      }
    ]
  },
  {
    title: "Communication",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    items: [
      {
        title: "Team",
        url: "/dashboard/collaborate",
        icon: Users,
        color: "text-pink-600",
        hoverColor: "hover:bg-pink-50"
      },
      {
        title: "Communication Hub",
        url: "/dashboard/comments",
        icon: MessageSquare,
        color: "text-pink-600",
        hoverColor: "hover:bg-pink-50"
      },
      {
        title: "Notification",
        url: "/dashboard/notification",
        icon: Bell,
        color: "text-pink-600",
        hoverColor: "hover:bg-pink-50"
      },
      {
        title: "Billing & Invoices",
        url: "/dashboard/invoices",
        icon: Receipt,
        color: "text-pink-600",
        hoverColor: "hover:bg-pink-50"
      }
    ]
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { userRoles } = useAuth();
  const createEventUrl = useCreateEventEntryPath();
  const ownsActiveEvents = useOwnsActiveEvents();
  const isAdmin = userRoles.includes("admin");
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const cmFooter = cmSidebarFooterText();

  const resolvedMenuGroups = useMemo(
    () =>
      menuGroups.map((g) => ({
        ...g,
        items: g.items
          .filter((item) => {
            if ("ownerOnly" in item && (item as { ownerOnly?: boolean }).ownerOnly && !ownsActiveEvents) {
              return false;
            }
            // First-time users: "Create event" already opens Themes — hide duplicate Resources → Themes.
            if (item.title === "Themes" && createEventUrl === CREATE_EVENT_PATH_NEW_PLANNER) {
              return false;
            }
            return true;
          })
          .map((item) => {
            if (item.title !== "Create event") return item;
            const isNewPlannerEntry = createEventUrl === CREATE_EVENT_PATH_NEW_PLANNER;
            return {
              ...item,
              url: createEventUrl,
              title: isNewPlannerEntry ? "Browse event themes" : "Create event",
              isCreateEventEntry: true as const,
            };
          }),
      })),
    [createEventUrl, ownsActiveEvents],
  );

  /**
   * Active state: pathname must match. Query rules:
   * - Reports: tab must match (event-plan treats missing tab as overview).
   * - Project Management: link without `tab` = Task/Budget (not Collaborator). `tab=collaborator` matches Collaborator workspace.
   */
  const pathIsActive = (url: string) => {
    const [path, query] = url.split("?");
    const base = currentPath === path || currentPath === `${path}/`;
    if (!base) return false;

    const have = new URLSearchParams(location.search);
    const tabHave = have.get("tab");

    if (path === "/dashboard/project-management") {
      if (query) {
        const want = new URLSearchParams(query);
        return tabHave === want.get("tab");
      }
      return tabHave !== "collaborator";
    }

    if (path === "/dashboard/collaborate") {
      if (!query) {
        return tabHave === null || tabHave === "team";
      }
      const want = new URLSearchParams(query);
      return tabHave === want.get("tab");
    }

    if (!query) return true;

    const want = new URLSearchParams(query);
    const tabW = want.get("tab");
    if (tabW === "event-plan") {
      return have.get("tab") === "event-plan" || have.get("tab") === null;
    }
    return have.get("tab") === tabW;
  };

  const getNavClass = (item: { color: string; hoverColor: string }, active: boolean) => {
    const base =
      "transition-all duration-200 rounded-md mx-1 my-0.5 px-2 py-2 w-[calc(100%-0.25rem)] min-w-0";
    if (active) {
      return `${base} bg-primary text-primary-foreground font-semibold shadow-md border-l-4 border-primary ring-1 ring-primary/20 [&_svg]:text-primary-foreground`;
    }
    return `${base} text-muted-foreground ${item.color} ${item.hoverColor} hover:text-foreground hover:shadow-sm`;
  };

  return (
    <Sidebar
      className={`${collapsed ? "w-14" : "w-64"} border-r bg-gradient-to-b from-background to-muted/30`}
      collapsible="icon"
    >
      <SidebarContent className="px-2 py-4">
        {!collapsed && (
          <div className="mb-6 px-4">
            <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Event Management
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Professional event planning platform
            </p>
          </div>
        )}
        
        {resolvedMenuGroups.map((group) => (
          <SidebarGroup key={group.title} className="mb-4">
            {!collapsed && (
              <SidebarGroupLabel className={`text-xs font-semibold ${group.color} uppercase tracking-wider px-4 py-2 ${group.bgColor} rounded-lg mx-2 mb-2`}>
                {group.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items
                  .filter((item) => !(item as { adminOnly?: boolean }).adminOnly || isAdmin)
                  .map((item) => {
                  const active = (item as { isCreateEventEntry?: boolean }).isCreateEventEntry
                    ? createEventUrl === CREATE_EVENT_PATH_NEW_PLANNER
                      ? currentPath === "/dashboard/themes" ||
                        currentPath.startsWith("/dashboard/create-event")
                      : pathIsActive(item.url)
                    : pathIsActive(item.url);
                  const createEntry = (item as { isCreateEventEntry?: boolean }).isCreateEventEntry;
                  const navTitle =
                    createEntry && createEventUrl === CREATE_EVENT_PATH_NEW_PLANNER
                      ? "Pick a theme first, then continue to Create event."
                      : undefined;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active}>
                        <NavLink
                          to={item.url}
                          end
                          title={navTitle}
                          className={() => getNavClass(item, active)}
                        >
                          <item.icon
                            className={`h-5 w-5 shrink-0 ${collapsed ? "mx-auto" : "mr-2"} transition-colors duration-200`}
                          />
                          {!collapsed && (
                            <span className="truncate text-sm font-medium">{item.title}</span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        
        {!collapsed && cmFooter && (
          <div className="mt-6 px-4 pt-4 border-t border-border/60">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              {cmFooter}
            </p>
          </div>
        )}
        {collapsed && (
          <div className="mt-auto px-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-secondary mx-auto" />
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
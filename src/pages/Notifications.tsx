import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  Bell,
  Check,
  CheckCheck,
  Filter,
  Settings,
  Trash2,
  MessageSquare,
  Calendar,
  AlertTriangle,
  Info,
  Clock,
} from "lucide-react";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "task" | "comment" | "event" | "system" | "mention" | "reminder";
  isRead: boolean;
  timestamp: string;
  sender?: string;
  senderName?: string;
  priority: "low" | "medium" | "high";
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskUpdates: boolean;
  comments: boolean;
  mentions: boolean;
  eventReminders: boolean;
  systemAlerts: boolean;
}

function mapDbTypeToUi(dbType: string): Notification["type"] {
  switch (dbType) {
    case "task_update":
      return "task";
    case "event_update":
      return "event";
    case "budget_update":
      return "reminder";
    case "new_request":
      return "comment";
    case "mention":
      return "mention";
    default:
      return "system";
  }
}

function priorityFromDbType(dbType: string): Notification["priority"] {
  switch (dbType) {
    case "event_update":
    case "budget_update":
      return "high";
    case "task_update":
    case "new_request":
      return "medium";
    default:
      return "low";
  }
}

function mapRow(row: NotificationRow, senderNames: Record<string, string>): Notification {
  const sender = row.sender_id ?? undefined;
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: mapDbTypeToUi(row.type),
    isRead: row.is_read,
    timestamp: row.created_at,
    sender,
    senderName: sender ? senderNames[sender] : undefined,
    priority: priorityFromDbType(row.type),
  };
}

export default function Notifications() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    taskUpdates: true,
    comments: true,
    mentions: true,
    eventReminders: true,
    systemAlerts: false,
  });

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setListLoading(false);
      return;
    }
    setListLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("notifications load", error);
      toast({
        variant: "destructive",
        title: "Could not load notifications",
        description: error.message,
      });
      setNotifications([]);
      setListLoading(false);
      return;
    }

    const rows = data ?? [];
    const senderIds = [...new Set(rows.map((r) => r.sender_id).filter(Boolean))] as string[];
    let senderNames: Record<string, string> = {};
    if (senderIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name, username")
        .in("user_id", senderIds);
      senderNames = Object.fromEntries(
        (profs ?? []).map((p) => [
          p.user_id,
          p.display_name?.trim() || p.username?.trim() || "Team member",
        ])
      );
    }

    setNotifications(rows.map((row) => mapRow(row as NotificationRow, senderNames)));
    setListLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications-inbox-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadNotifications]);

  useEffect(() => {
    let filtered = notifications;

    switch (selectedFilter) {
      case "unread":
        filtered = notifications.filter((n) => !n.isRead);
        break;
      case "task":
      case "comment":
      case "event":
      case "mention":
      case "system":
      case "reminder":
        filtered = notifications.filter((n) => n.type === selectedFilter);
        break;
      default:
        filtered = notifications;
    }

    setFilteredNotifications(filtered);
  }, [notifications, selectedFilter]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task":
        return CheckCheck;
      case "comment":
        return MessageSquare;
      case "event":
        return Calendar;
      case "mention":
        return Bell;
      case "reminder":
        return AlertTriangle;
      case "system":
        return Info;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string, isRead: boolean) => {
    const opacity = isRead ? "opacity-60" : "";
    switch (type) {
      case "task":
        return `text-blue-500 ${opacity}`;
      case "comment":
        return `text-green-500 ${opacity}`;
      case "event":
        return `text-purple-500 ${opacity}`;
      case "mention":
        return `text-orange-500 ${opacity}`;
      case "reminder":
        return `text-red-500 ${opacity}`;
      case "system":
        return `text-gray-500 ${opacity}`;
      default:
        return `text-gray-500 ${opacity}`;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
      return;
    }

    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    window.dispatchEvent(new Event("notificationsMarkedRead"));
    toast({
      title: "Notification marked as read",
      description: "The notification has been marked as read.",
    });
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", user.id)
      .eq("is_read", false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
      return;
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    window.dispatchEvent(new Event("notificationsMarkedRead"));
    toast({
      title: "All notifications marked as read",
      description: "Your inbox is up to date.",
    });
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Could not delete",
        description: error.message,
      });
      return;
    }

    setNotifications((prev) => prev.filter((n) => n.id !== id));
    window.dispatchEvent(new Event("notificationsMarkedRead"));
    toast({
      title: "Notification deleted",
      description: "The notification has been removed.",
    });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (authLoading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Sign in to see your notifications.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-muted-foreground">Stay updated with your event planning activities (live inbox)</p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read ({unreadCount})
            </Button>
          )}

          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Notification Settings</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground mb-4">
                Preferences below are stored on this device for now; connect to profile storage when available.
              </p>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Delivery Methods</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email">Email Notifications</Label>
                      <Switch
                        id="email"
                        checked={settings.emailNotifications}
                        onCheckedChange={(v) => handleSettingChange("emailNotifications", !!v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push">Push Notifications</Label>
                      <Switch
                        id="push"
                        checked={settings.pushNotifications}
                        onCheckedChange={(v) => handleSettingChange("pushNotifications", !!v)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Notification Types</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="tasks">Task Updates</Label>
                      <Switch
                        id="tasks"
                        checked={settings.taskUpdates}
                        onCheckedChange={(v) => handleSettingChange("taskUpdates", !!v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="comments">Comments</Label>
                      <Switch
                        id="comments"
                        checked={settings.comments}
                        onCheckedChange={(v) => handleSettingChange("comments", !!v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="mentions">Mentions</Label>
                      <Switch
                        id="mentions"
                        checked={settings.mentions}
                        onCheckedChange={(v) => handleSettingChange("mentions", !!v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="reminders">Event Reminders</Label>
                      <Switch
                        id="reminders"
                        checked={settings.eventReminders}
                        onCheckedChange={(v) => handleSettingChange("eventReminders", !!v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="system">System Alerts</Label>
                      <Switch
                        id="system"
                        checked={settings.systemAlerts}
                        onCheckedChange={(v) => handleSettingChange("systemAlerts", !!v)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <Select value={selectedFilter} onValueChange={setSelectedFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2 shrink-0" />
            <SelectValue placeholder="Filter notifications" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Notifications</SelectItem>
            <SelectItem value="unread">Unread Only</SelectItem>
            <SelectItem value="task">Task Updates</SelectItem>
            <SelectItem value="comment">Comments</SelectItem>
            <SelectItem value="event">Events</SelectItem>
            <SelectItem value="mention">Mentions</SelectItem>
            <SelectItem value="reminder">Reminders</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="outline">{filteredNotifications.length} notifications</Badge>

        {unreadCount > 0 && <Badge variant="destructive">{unreadCount} unread</Badge>}
      </div>

      <div className="space-y-4">
        {listLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">Loading notifications…</CardContent>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground text-center">
                {selectedFilter === "unread"
                  ? "You're all caught up! No unread notifications."
                  : "No notifications match your current filter."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const IconComponent = getNotificationIcon(notification.type);
            return (
              <Card
                key={notification.id}
                className={`transition-all ${!notification.isRead ? "border-primary/50 bg-primary/5" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-full bg-background ${getNotificationColor(notification.type, notification.isRead)}`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`font-medium ${notification.isRead ? "text-muted-foreground" : ""}`}>
                              {notification.title}
                            </h4>
                            <Badge variant={getPriorityColor(notification.priority) as "default" | "secondary" | "destructive"} className="text-xs">
                              {notification.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {notification.type}
                            </Badge>
                          </div>
                          <p className={`text-sm break-words ${notification.isRead ? "text-muted-foreground" : ""}`}>
                            {notification.message}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!notification.isRead && (
                            <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => deleteNotification(notification.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground gap-2 flex-wrap">
                        <div className="flex items-center gap-4">
                          {notification.senderName && <span>{notification.senderName}</span>}
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{new Date(notification.timestamp).toLocaleString()}</span>
                          </div>
                        </div>

                        {!notification.isRead && <div className="w-2 h-2 bg-primary rounded-full shrink-0" />}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

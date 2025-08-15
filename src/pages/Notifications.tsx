import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  Filter,
  Settings,
  Trash2,
  Mail,
  MessageSquare,
  Calendar,
  AlertTriangle,
  Info,
  UserPlus,
  FileText,
  Clock
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'task' | 'comment' | 'event' | 'system' | 'mention' | 'reminder';
  isRead: boolean;
  timestamp: string;
  sender?: string;
  senderName?: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
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

export default function Notifications() {
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    taskUpdates: true,
    comments: true,
    mentions: true,
    eventReminders: true,
    systemAlerts: false
  });

  // Mock notifications data
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: "1",
        title: "Task Assigned",
        message: "You have been assigned to 'Venue Contract Finalization'",
        type: "task",
        isRead: false,
        timestamp: "2024-08-15T14:30:00Z",
        sender: "1",
        senderName: "John Doe",
        priority: "high"
      },
      {
        id: "2",
        title: "New Comment",
        message: "Sarah Wilson commented on 'Catering Menu Selection'",
        type: "comment",
        isRead: false,
        timestamp: "2024-08-15T13:45:00Z",
        sender: "2",
        senderName: "Sarah Wilson",
        priority: "medium"
      },
      {
        id: "3",
        title: "Event Reminder",
        message: "Event 'Annual Company Gala' is scheduled for tomorrow",
        type: "event",
        isRead: true,
        timestamp: "2024-08-15T12:00:00Z",
        priority: "high"
      },
      {
        id: "4",
        title: "Mentioned in Comment",
        message: "Mike Johnson mentioned you in a comment about 'Audio/Visual Setup'",
        type: "mention",
        isRead: false,
        timestamp: "2024-08-15T11:15:00Z",
        sender: "3",
        senderName: "Mike Johnson",
        priority: "medium"
      },
      {
        id: "5",
        title: "Task Overdue",
        message: "Task 'Guest List Management' is now overdue",
        type: "reminder",
        isRead: true,
        timestamp: "2024-08-15T10:00:00Z",
        priority: "high"
      },
      {
        id: "6",
        title: "System Update",
        message: "New collaboration features have been added to the platform",
        type: "system",
        isRead: true,
        timestamp: "2024-08-15T09:30:00Z",
        priority: "low"
      },
      {
        id: "7",
        title: "New Team Member",
        message: "Alex Chen has joined your event planning team",
        type: "system",
        isRead: false,
        timestamp: "2024-08-15T08:45:00Z",
        priority: "medium"
      }
    ];

    setNotifications(mockNotifications);
    setFilteredNotifications(mockNotifications);
  }, []);

  // Filter notifications
  useEffect(() => {
    let filtered = notifications;
    
    switch (selectedFilter) {
      case 'unread':
        filtered = notifications.filter(n => !n.isRead);
        break;
      case 'task':
      case 'comment':
      case 'event':
      case 'mention':
      case 'system':
        filtered = notifications.filter(n => n.type === selectedFilter);
        break;
      default:
        filtered = notifications;
    }
    
    setFilteredNotifications(filtered);
  }, [notifications, selectedFilter]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task': return CheckCheck;
      case 'comment': return MessageSquare;
      case 'event': return Calendar;
      case 'mention': return Bell;
      case 'reminder': return AlertTriangle;
      case 'system': return Info;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string, isRead: boolean) => {
    const opacity = isRead ? 'opacity-60' : '';
    switch (type) {
      case 'task': return `text-blue-500 ${opacity}`;
      case 'comment': return `text-green-500 ${opacity}`;
      case 'event': return `text-purple-500 ${opacity}`;
      case 'mention': return `text-orange-500 ${opacity}`;
      case 'reminder': return `text-red-500 ${opacity}`;
      case 'system': return `text-gray-500 ${opacity}`;
      default: return `text-gray-500 ${opacity}`;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    toast({
      title: "Notification marked as read",
      description: "The notification has been marked as read.",
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
    toast({
      title: "All notifications marked as read",
      description: "All notifications have been marked as read.",
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast({
      title: "Notification deleted",
      description: "The notification has been removed.",
    });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Settings updated",
      description: "Your notification preferences have been saved.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-muted-foreground">
            Stay updated with your event planning activities
          </p>
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
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Delivery Methods</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email">Email Notifications</Label>
                      <Switch
                        id="email"
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push">Push Notifications</Label>
                      <Switch
                        id="push"
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
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
                        onCheckedChange={(checked) => handleSettingChange('taskUpdates', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="comments">Comments</Label>
                      <Switch
                        id="comments"
                        checked={settings.comments}
                        onCheckedChange={(checked) => handleSettingChange('comments', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="mentions">Mentions</Label>
                      <Switch
                        id="mentions"
                        checked={settings.mentions}
                        onCheckedChange={(checked) => handleSettingChange('mentions', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="reminders">Event Reminders</Label>
                      <Switch
                        id="reminders"
                        checked={settings.eventReminders}
                        onCheckedChange={(checked) => handleSettingChange('eventReminders', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="system">System Alerts</Label>
                      <Switch
                        id="system"
                        checked={settings.systemAlerts}
                        onCheckedChange={(checked) => handleSettingChange('systemAlerts', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-4">
        <Select value={selectedFilter} onValueChange={setSelectedFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter notifications" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Notifications</SelectItem>
            <SelectItem value="unread">Unread Only</SelectItem>
            <SelectItem value="task">Task Updates</SelectItem>
            <SelectItem value="comment">Comments</SelectItem>
            <SelectItem value="event">Events</SelectItem>
            <SelectItem value="mention">Mentions</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
        
        <Badge variant="outline">
          {filteredNotifications.length} notifications
        </Badge>
        
        {unreadCount > 0 && (
          <Badge variant="destructive">
            {unreadCount} unread
          </Badge>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground text-center">
                {selectedFilter === 'unread' 
                  ? "You're all caught up! No unread notifications."
                  : "No notifications match your current filter."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const IconComponent = getNotificationIcon(notification.type);
            return (
              <Card key={notification.id} className={`transition-all ${!notification.isRead ? 'border-primary/50 bg-primary/5' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full bg-background ${getNotificationColor(notification.type, notification.isRead)}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-medium ${notification.isRead ? 'text-muted-foreground' : ''}`}>
                              {notification.title}
                            </h4>
                            <Badge variant={getPriorityColor(notification.priority) as any} className="text-xs">
                              {notification.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {notification.type}
                            </Badge>
                          </div>
                          <p className={`text-sm ${notification.isRead ? 'text-muted-foreground' : ''}`}>
                            {notification.message}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          {notification.senderName && (
                            <div className="flex items-center gap-1">
                              <Avatar className="w-4 h-4">
                                <AvatarFallback className="text-xs">
                                  {notification.senderName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span>{notification.senderName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(notification.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                        
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}
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
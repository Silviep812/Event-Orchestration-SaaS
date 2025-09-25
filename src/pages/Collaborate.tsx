import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, 
  MessageSquare, 
  FileText, 
  Calendar,
  Plus,
  Send,
  UserPlus,
  Clock,
  CheckCircle,
  AlertCircle,
  FileIcon,
  Download,
  Upload
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  status: 'online' | 'offline' | 'busy' | 'invited';
  joinedAt: string;
}

interface Message {
  id: string;
  content: string;
  sender: string;
  senderName: string;
  timestamp: string;
  type: 'text' | 'file' | 'system';
}

interface SharedFile {
  id: string;
  name: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
}

interface Activity {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  type: 'task' | 'comment' | 'file' | 'member';
}

export default function Collaborate() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("team");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);

  // Fetch real team members data
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase.functions.invoke('get-invited-users', {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });

        if (error) {
          console.error('Error fetching team members:', error);
          return;
        }

        if (data.success) {
          setTeamMembers(data.teamMembers);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
      }
    };

    fetchTeamMembers();

    setMessages([
      {
        id: "1",
        content: "Welcome to the collaboration space! Let's work together on the upcoming events.",
        sender: "system",
        senderName: "System",
        timestamp: "2024-08-15T10:00:00Z",
        type: "system"
      },
      {
        id: "2",
        content: "I've uploaded the venue contract for review. Please check it out!",
        sender: "1",
        senderName: "John Doe",
        timestamp: "2024-08-15T10:30:00Z",
        type: "text"
      }
    ]);

    setSharedFiles([
      {
        id: "1",
        name: "Venue_Contract_Final.pdf",
        size: "2.4 MB",
        uploadedBy: "John Doe",
        uploadedAt: "2024-08-15T10:25:00Z",
        url: "#"
      },
      {
        id: "2",
        name: "Budget_Breakdown.xlsx",
        size: "1.8 MB",
        uploadedBy: "Sarah Wilson",
        uploadedAt: "2024-08-15T09:15:00Z",
        url: "#"
      }
    ]);

    setActivities([
      {
        id: "1",
        user: "John Doe",
        action: "uploaded Venue_Contract_Final.pdf",
        timestamp: "2024-08-15T10:25:00Z",
        type: "file"
      },
      {
        id: "2",
        user: "Sarah Wilson",
        action: "completed task: Review vendor proposals",
        timestamp: "2024-08-15T09:45:00Z",
        type: "task"
      },
      {
        id: "3",
        user: "Mike Johnson",
        action: "joined the team",
        timestamp: "2024-08-15T08:30:00Z",
        type: "member"
      }
    ]);
  }, [user]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: user.id,
      senderName: user.email || "Current User",
      timestamp: new Date().toISOString(),
      type: "text"
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");

    toast({
      title: "Message sent",
      description: "Your message has been sent to the team.",
    });
  };

  const handleInviteMember = async () => {
    if (!inviteEmail || !inviteRole) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          email: inviteEmail,
          role: inviteRole,
          inviterName: user?.email?.split('@')[0] || 'Team Admin',
          inviterEmail: user?.email || 'admin@example.com'
        }
      });

      if (error) {
        console.error('Error sending invitation:', error);
        toast({
          title: "Error",
          description: "Failed to send invitation. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${inviteEmail} as ${inviteRole}.`,
      });

      setInviteEmail("");
      setInviteRole("");
      setIsInviteDialogOpen(false);
      
      // Refresh team members list
      const { data: refreshData, error: refreshError } = await supabase.functions.invoke('get-invited-users', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      
      if (refreshData?.success) {
        setTeamMembers(refreshData.teamMembers);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      case 'invited': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task': return CheckCircle;
      case 'file': return FileIcon;
      case 'member': return UserPlus;
      case 'comment': return MessageSquare;
      default: return AlertCircle;
    }
  };

  const handleMemberClick = (member: TeamMember) => {
    setSelectedMember(member);
    setIsMemberDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Team Collaboration
          </h1>
          <p className="text-muted-foreground">
            Work together seamlessly on your events
          </p>
        </div>
        
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-secondary">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="host">Host</SelectItem>
                    <SelectItem value="organizer">Organizer</SelectItem>
                    <SelectItem value="event_planner">Event Planner</SelectItem>
                    <SelectItem value="venue_owner">Venue Owner</SelectItem>
                    <SelectItem value="hospitality_provider">Hospitality Provider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleInviteMember} className="w-full">
                Send Invitation
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Member Details Dialog */}
        <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Team Member Details</DialogTitle>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={selectedMember.avatar} />
                      <AvatarFallback className="text-lg">
                        {selectedMember.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(selectedMember.status)}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{selectedMember.name}</h3>
                    <p className="text-muted-foreground break-all">{selectedMember.email}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-sm">{selectedMember.role}</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedMember.status)}`} />
                      <span className="capitalize text-sm">{selectedMember.status}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Joined Date</label>
                    <p className="text-sm mt-1">
                      {new Date(selectedMember.joinedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Files
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member) => (
              <Card 
                key={member.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleMemberClick(member)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{member.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant="secondary">{member.role}</Badge>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(member.status)}`} />
                      <span className="capitalize">{member.status}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card className="h-96">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Team Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {message.senderName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{message.senderName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Shared Files</h3>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </div>
          
          <div className="grid gap-4">
            {sharedFiles.map((file) => (
              <Card key={file.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <FileIcon className="w-8 h-8 text-primary" />
                    <div>
                      <h4 className="font-medium">{file.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {file.size} • Uploaded by {file.uploadedBy} • {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => {
                  const IconComponent = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-center gap-3">
                      <IconComponent className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span> {activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
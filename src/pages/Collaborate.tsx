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
import { TeamMemberCard } from "@/components/TeamMemberCard";
import { NoTeamMembersCard } from "@/components/NoTeamMembersCard";

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
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
  const [inviteAttributes, setInviteAttributes] = useState<{ coordinator: boolean; viewer: boolean }>({ coordinator: false, viewer: false });
  const [selectedCollaboratorTypes, setSelectedCollaboratorTypes] = useState<string[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamCollaboratorTypes, setTeamCollaboratorTypes] = useState<string[]>([]);
  const [userTeam, setUserTeam] = useState<{ id: string; name: string } | null>(null);
  const [userTeams, setUserTeams] = useState<{ id: string; name: string; members: TeamMember[]; isAdmin: boolean }[]>([]);
  const [eventParticipants, setEventParticipants] = useState<{ email: string; name: string }[]>([]);

  // Fetch event participants for invitation dropdown
  useEffect(() => {
    const fetchEventParticipants = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('Create Event')
          .select('event_collaborators')
          .eq('userid', user.id);
        
        if (!error && data) {
          const participants: { email: string; name: string }[] = [];
          data.forEach((event) => {
            if (event.event_collaborators && Array.isArray(event.event_collaborators)) {
              event.event_collaborators.forEach((collab: string) => {
                if (collab.includes('@')) {
                  participants.push({ email: collab, name: collab.split('@')[0] });
                }
              });
            }
          });
          const uniqueParticipants = Array.from(
            new Map(participants.map(p => [p.email, p])).values()
          );
          setEventParticipants(uniqueParticipants);
        }
      } catch (error) {
        console.error('Error fetching event participants:', error);
      }
    };
    
    fetchEventParticipants();
  }, [user]);


  // Fetch user's team if they're an admin
  useEffect(() => {
    const fetchUserTeam = async () => {
      if (!user) return;

      try {
        const { data: teamAssignment, error } = await supabase
          .from('team_assignments')
          .select('team_id, team_admin, teams(id, name)')
          .eq('user_id', user.id)
          .eq('team_admin', true)
          .single();

        if (!error && teamAssignment?.teams) {
          setUserTeam({
            id: (teamAssignment.teams as any).id,
            name: (teamAssignment.teams as any).name
          });
        }
      } catch (error) {
        console.error('Error fetching user team:', error);
      }
    };

    fetchUserTeam();
  }, [user]);

  // Fetch real team members data
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!user || !userTeam) return;

      try {
        // Get team members from team_assignments table
        const { data: assignments, error: assignmentsError } = await supabase
          .from('team_assignments')
          .select('user_id, team_admin, is_coordinator, is_viewer')
          .eq('team_id', userTeam.id);

        if (assignmentsError) {
          console.error('Error fetching team assignments:', assignmentsError);
          return;
        }

        if (!assignments || assignments.length === 0) {
          setTeamMembers([]);
          return;
        }

        // Get user details from profiles table
        const userIds = assignments.map(a => a.user_id);
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);

        if (usersError) {
          console.error('Error fetching user details:', usersError);
        }

        // Get roles from user_roles table
        const { data: userRolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        if (rolesError) {
          console.error('Error fetching user roles:', rolesError);
        }

        // Create maps for quick lookup
        const usersMap = new Map(usersData?.map(u => [u.user_id, u]) || []);
        const rolesMap = new Map(userRolesData?.map(r => [r.user_id, r.role]) || []);

        // Combine data
        const members: TeamMember[] = assignments.map(assignment => {
          const userDetails = usersMap.get(assignment.user_id);
          const role = rolesMap.get(assignment.user_id);
          
          let roleDisplay = role || 'Member';
          if (assignment.team_admin) {
            roleDisplay = 'Admin';
          } else if (assignment.is_coordinator) {
            roleDisplay = 'Coordinator';
          } else if (assignment.is_viewer) {
            roleDisplay = 'Viewer';
          }

          return {
            id: assignment.user_id,
            name: userDetails?.display_name || 'Unknown User',
            role: roleDisplay,
            status: assignment.user_id === user?.id ? 'online' as const : 'offline' as const,
            joinedAt: new Date().toISOString()
          };
        });

        setTeamMembers(members);
      } catch (error) {
        console.error('Error fetching team members:', error);
      }
    };

    fetchTeamMembers();
  }, [user, userTeam]);

  // Set mock data for messages, files, and activities
  useEffect(() => {
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

  // Fetch user's teams and their members
  useEffect(() => {
    const fetchUserTeams = async () => {
      if (!user) return;
      try {
        // Get all team assignments for the user
        const { data: assignments, error: assignmentsError } = await supabase
          .from('team_assignments')
          .select('team_id, team_admin, teams(id, name)')
          .eq('user_id', user.id);
        if (assignmentsError || !assignments) return;
        // For each team, fetch its members
        const teamsWithMembers = await Promise.all(assignments.map(async (assignment: any) => {
          const teamId = assignment.team_id;
          const teamName = assignment.teams?.name || 'Unnamed Team';
          const isAdmin = !!assignment.team_admin;
          // Get all members for this team (excluding current user)
          const { data: memberAssignments } = await supabase
            .from('team_assignments')
            .select('user_id, team_admin')
            .eq('team_id', teamId)
            .neq('user_id', user.id);

          const userIds = (memberAssignments || []).map((ma: any) => ma.user_id);

          let usersMap: Record<string, { id: string; name: string; email: string }> = {};
          if (userIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('user_id, display_name')
              .in('user_id', userIds);

            if (profilesData) {
              usersMap = profilesData.reduce((acc: any, u: any) => {
                // Use only display_name, username field contains domain not actual name
                acc[u.user_id] = { 
                  id: u.user_id, 
                  name: u.display_name || 'Unknown User',
                  email: '' // Email not available in profiles table
                };
                return acc;
              }, {});
            }
          }

          const members: TeamMember[] = (memberAssignments || []).map((ma: any) => {
            const userInfo = usersMap[ma.user_id];
            return {
              id: ma.user_id,
              name: userInfo?.name || "Unknown User",
              email: userInfo?.email || '',
              role: ma.team_admin ? 'Admin' : 'Member',
              status: 'offline',
              joinedAt: new Date().toISOString()
            };
          });
          return { id: teamId, name: teamName, members, isAdmin };
        }));
        setUserTeams(teamsWithMembers);
      } catch (error) {
        console.error('Error fetching user teams:', error);
      }
    };
    fetchUserTeams();
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
    if (!inviteEmail || !inviteRole || selectedCollaboratorTypes.length === 0) {
      toast({
        title: "Error",
        description: "Please select a participant, role, and at least one collaborator type.",
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
          inviterEmail: user?.email || 'admin@example.com',
          teamId: userTeam?.id,
          isCoordinator: inviteAttributes.coordinator,
          isViewer: inviteAttributes.viewer,
          collaboratorTypes: selectedCollaboratorTypes,
        }
      });

      if (error) {
        console.error('Error sending invitation:', error);
        
        // Check if it's the "user already exists" error
        const errorMessage = error.message || '';
        if (errorMessage.includes('already been registered') || errorMessage.includes('email_exists')) {
          toast({
            title: "User Already Exists",
            description: "This email is already registered. Try adding them to your team instead.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to send invitation. Please try again.",
            variant: "destructive"
          });
        }
        return;
      }

      // Check if the response contains an error in the data
      if (data && !data.success) {
        const errorMsg = data.error || '';
        if (errorMsg.includes('already been registered') || errorMsg.includes('email_exists')) {
          toast({
            title: "User Already Exists",
            description: "This email is already registered. Try adding them to your team instead.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to send invitation.",
            variant: "destructive"
          });
        }
        return;
      }

      const isExistingUser = data?.isExistingUser;
      
      toast({
        title: isExistingUser ? "Team Member Added" : "Invitation Sent",
        description: isExistingUser 
          ? `${inviteEmail} has been added to your team as ${inviteRole}.`
          : `Invitation sent to ${inviteEmail} as ${inviteRole}.`,
      });

      setInviteEmail("");
      setInviteRole("");
      setInviteAttributes({ coordinator: false, viewer: false });
      setSelectedCollaboratorTypes([]);
      setIsInviteDialogOpen(false);
      
      // Refresh team members list with updated roles
      const { data: refreshData, error: refreshError } = await supabase.functions.invoke('get-invited-users', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      
      if (refreshData?.success) {
        // Get updated roles from database
        const { data: userRolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (!rolesError && userRolesData) {
          const rolesMap = new Map();
          userRolesData.forEach(role => {
            rolesMap.set(role.user_id, role.role);
          });

          const membersWithRoles = refreshData.teamMembers.map((member: TeamMember) => ({
            ...member,
            role: rolesMap.get(member.id) || 'Member'
          }));

          setTeamMembers(membersWithRoles);
        } else {
          setTeamMembers(refreshData.teamMembers);
        }
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

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a team name.",
        variant: "destructive"
      });
      return;
    }

    if (teamCollaboratorTypes.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one collaborator type.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a team.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create the team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({ name: teamName })
        .select()
        .single();

      if (teamError) {
        console.error('Error creating team:', teamError);
        toast({
          title: "Error",
          description: "Failed to create team. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Create team assignment with current user as admin
      const { error: assignmentError } = await supabase
        .from('team_assignments')
        .insert({
          team_id: teamData.id,
          user_id: user.id,
          team_admin: true
        });

      if (assignmentError) {
        console.error('Error creating team assignment:', assignmentError);
        const msg = (assignmentError as any)?.message || "Failed to assign team admin.";
        const details = (assignmentError as any)?.details ? ` Details: ${(assignmentError as any).details}` : "";
        toast({
          title: "Failed to assign team admin",
          description: `${msg}${details}`,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `Team "${teamName}" created with ${teamCollaboratorTypes.join(', ')} collaborators!`,
      });

      setTeamName("");
      setTeamCollaboratorTypes([]);
      setIsCreateTeamDialogOpen(false);
      
      // Update userTeam state
      setUserTeam({ id: teamData.id, name: teamData.name });
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
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

        {/* Create Team Dialog */}
        <Dialog 
          open={isCreateTeamDialogOpen} 
          onOpenChange={(open) => {
            setIsCreateTeamDialogOpen(open);
            if (!open) {
              setTeamName("");
              setTeamCollaboratorTypes([]);
            }
          }}
        >
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Team Name</label>
                <Input
                  placeholder="Enter team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Collaborator Types (select all that apply)</label>
                <div className="mt-2 max-h-48 overflow-y-auto space-y-2 border rounded-md p-3 bg-background">
                  {['Bookings', 'Venue', 'Vendor Service Rental/Buy', 'Hospitality', 'Service Vendor', 'Transportation', 'Entertainment', 'Suppliers'].map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={teamCollaboratorTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTeamCollaboratorTypes([...teamCollaboratorTypes, type]);
                          } else {
                            setTeamCollaboratorTypes(teamCollaboratorTypes.filter(t => t !== type));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreateTeam} className="w-full">
                Create Team
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
                      <Badge variant="secondary" className="text-sm">{selectedMember.role.replace('_', ' ')}</Badge>
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
          {/* Show all teams the user belongs to and their members */}
          {userTeams.length > 0 && (
            <div className="space-y-8 mt-4">
              {userTeams.map(team => (
                <div key={team.id}>
                  <div className="border-primary/20 bg-primary/5 rounded-lg px-6 py-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {team.isAdmin ? 'You are Team Admin for' : 'You are a Team Member of'}
                        </p>
                        <h3 className="text-lg font-semibold">{team.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {team.members.length === 0 ? (
                    <NoTeamMembersCard
                      userTeam={userTeam}
                      userTeams={userTeams}
                      onCreateTeam={() => setIsCreateTeamDialogOpen(true)}
                      onInviteMember={() => setIsInviteDialogOpen(true)}
                    />
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 py-4">
                      {!team.isAdmin && team.members.map(member => (
                        <TeamMemberCard
                          key={member.id}
                          member={member}
                          onClick={handleMemberClick}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {teamMembers.length === 0 && (userTeams.length === 0 || userTeam) ? (
            <NoTeamMembersCard
              userTeam={userTeam}
              userTeams={userTeams}
              onCreateTeam={() => setIsCreateTeamDialogOpen(true)}
              onInviteMember={() => setIsInviteDialogOpen(true)}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  onClick={handleMemberClick}
                />
              ))}
            </div>
          )}
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
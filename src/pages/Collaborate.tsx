import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AvatarWithBrandFallback } from "@/components/AvatarWithBrandFallback";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, UserPlus, Clock, AlertCircle, FileIcon, Upload, CheckCircle, MessageSquare } from "lucide-react";
import { TeamMemberCard } from "@/components/TeamMemberCard";
import { NoTeamMembersCard } from "@/components/NoTeamMembersCard";

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  role: string;
  avatar?: string;
  status: 'online' | 'offline' | 'busy' | 'invited' | 'configured';
  joinedAt: string;
  collaboratorTypes?: string[];
  availability?: 'assigned' | 'unassigned';
  isConfiguration?: boolean;
}

interface Activity {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  type: 'task' | 'comment' | 'file' | 'member';
}

/** Stored values must stay stable for existing tasks/config; labels follow client markup naming. */
const COLLABORATOR_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Bookings', label: 'Bookings' },
  { value: 'Venue', label: 'Venue' },
  { value: 'Vendor Service Rental/Buy', label: 'Vendor Service Rental/Buy' },
  { value: 'Hospitality', label: 'Hospitality' },
  { value: 'Service Vendor', label: 'Service Vendor' },
  { value: 'Transportation', label: 'Transportation' },
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Suppliers', label: 'External Vendor' },
  { value: 'Vendors', label: 'Vendors' },
  { value: 'Marketing', label: 'Marketing' },
];

type CollaborateTab = "team" | "activity";

export default function Collaborate() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<CollaborateTab>(() => {
    const t = searchParams.get("tab");
    if (t === "activity") return t;
    return "team";
  });

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "activity") setActiveTab(t);
    else setActiveTab("team");
  }, [searchParams]);

  const handleCollaborateTabChange = (v: string) => {
    const next = v as CollaborateTab;
    setActiveTab(next);
    if (next === "team") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab: next }, { replace: true });
    }
  };
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  const inviteTeamId = activeTeamId ?? userTeam?.id ?? null;
  const isInviteTeamAdmin = useMemo(() => {
    if (!inviteTeamId) return false;
    return userTeams.some((t) => t.id === inviteTeamId && t.isAdmin);
  }, [inviteTeamId, userTeams]);

  useEffect(() => {
    if (inviteRole === "admin" && !isInviteTeamAdmin) {
      setInviteRole("");
    }
  }, [inviteRole, isInviteTeamAdmin]);

  const openInviteDialog = (teamId?: string | null) => {
    setActiveTeamId(teamId ?? userTeam?.id ?? null);
    setIsInviteDialogOpen(true);
  };

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


  // Fetch user's team if they're an admin (take first admin team)
  useEffect(() => {
    const fetchUserTeam = async () => {
      if (!user) return;

      try {
        const { data: teamAssignments, error } = await supabase
          .from('team_assignments')
          .select('team_id, team_admin, teams(id, name)')
          .eq('user_id', user.id)
          .eq('team_admin', true)
          .limit(1);

        if (!error && teamAssignments && teamAssignments.length > 0 && teamAssignments[0].teams) {
          setUserTeam({
            id: (teamAssignments[0].teams as any).id,
            name: (teamAssignments[0].teams as any).name
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
          .select('user_id, team_admin, is_collaborator, is_viewer')
          .eq('team_id', userTeam.id);

        if (assignmentsError) {
          console.error('Error fetching team assignments:', assignmentsError);
          return;
        }

        if (!assignments || assignments.length === 0) {
          setTeamMembers([]);
          return;
        }

        // Teammate-safe profile fields (name, role) via view — not public."User Profile"
        const userIds = assignments.map(a => a.user_id);
        const { data: usersData, error: usersError } = await supabase
          .from('user_profiles_teammate_view')
          .select('user_id, display_name, avatar_url, role')
          .in('user_id', userIds);

        if (usersError) {
          console.error('Error fetching user details:', usersError);
        }

        const usersMap = new Map(usersData?.map(u => [u.user_id, u]) || []);

        // Combine data
        const members: TeamMember[] = assignments.map(assignment => {
          const userDetails = usersMap.get(assignment.user_id);
          
          let roleDisplay = userDetails?.role || 'Member';
          if (assignment.team_admin) {
            roleDisplay = 'Admin';
          } else if (assignment.is_collaborator) {
            roleDisplay = 'Coordinator';
          } else if (assignment.is_viewer) {
            roleDisplay = 'Viewer';
          }

          return {
            id: assignment.user_id,
            name: userDetails?.display_name || 'Unknown User',
            role: roleDisplay,
            status: assignment.user_id === user?.id ? 'online' as const : 'offline' as const,
            joinedAt: new Date().toISOString(),
            availability: 'assigned',
            isConfiguration: false,
            avatar: userDetails?.avatar_url || ''
          };
        });

        // Fetch collaborator configurations (planned roles without assigned users)
        const { data: configs, error: configsError } = await supabase
          .from('collaborator_configurations')
          .select('*')
          .eq('team_id', userTeam.id)
          .is('assigned_user_id', null);

        if (!configsError && configs) {
          // Add configurations as "team members" with status "configured"
          const configMembers: TeamMember[] = configs.map(config => ({
            id: config.id,
            name: `${config.role} (Needed)`,
            role: config.role,
            status: 'configured' as const,
            joinedAt: config.created_at,
            collaboratorTypes: config.collaborator_types,
            availability: 'unassigned',
            isConfiguration: true
          }));
          
          setTeamMembers([...members, ...configMembers]);
        } else {
          setTeamMembers(members);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
      }
    };

    fetchTeamMembers();
  }, [user, userTeam]);

  // Fetch real activity data for invited and joined team members
  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;

      try {
        const activitiesData: Activity[] = [];

        // Fetch all teams the user is part of
        const { data: userTeamAssignments } = await supabase
          .from('team_assignments')
          .select('team_id')
          .eq('user_id', user.id);

        if (!userTeamAssignments || userTeamAssignments.length === 0) {
          setActivities([]);
          return;
        }

        const teamIds = userTeamAssignments.map(ta => ta.team_id);

        // Fetch all team assignments for these teams
        const { data: allAssignments } = await supabase
          .from('team_assignments')
          .select('user_id, created_at, team_id')
          .in('team_id', teamIds)
          .order('created_at', { ascending: false });

        if (allAssignments) {
          // Get user details for all assignments
          const userIds = allAssignments.map(a => a.user_id);
          const { data: usersData } = await supabase
            .from('user_profiles_teammate_view')
            .select('user_id, display_name')
            .in('user_id', userIds);

          const usersMap = new Map(usersData?.map(u => [u.user_id, u.display_name]) || []);

          // Add "joined team" activities
          allAssignments.forEach(assignment => {
            activitiesData.push({
              id: `joined-${assignment.user_id}-${assignment.created_at}`,
              user: usersMap.get(assignment.user_id) || 'Unknown User',
              action: 'joined the team',
              timestamp: assignment.created_at,
              type: 'member'
            });
          });
        }

        // Fetch collaborator configurations (invited but not yet assigned)
        const { data: configs } = await supabase
          .from('collaborator_configurations')
          .select('id, role, created_at, team_id')
          .in('team_id', teamIds)
          .is('assigned_user_id', null)
          .order('created_at', { ascending: false });

        if (configs) {
          configs.forEach(config => {
            activitiesData.push({
              id: `invited-${config.id}`,
              user: 'System',
              action: `invited ${config.role} to join the team`,
              timestamp: config.created_at,
              type: 'member'
            });
          });
        }

        // Sort all activities by timestamp
        activitiesData.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setActivities(activitiesData);
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };

    fetchActivities();
  }, [user, refreshTrigger]);

  // Fetch user's teams and their members
  useEffect(() => {
    const fetchUserTeams = async () => {
      if (!user) return;
      try {
        console.log('Fetching teams for user:', user.id);
        
        // Get all team assignments for the user
        const { data: assignments, error: assignmentsError } = await supabase
          .from('team_assignments')
          .select('team_id, team_admin, teams(id, name)')
          .eq('user_id', user.id);
        
        if (assignmentsError || !assignments) {
          console.error('Error fetching assignments:', assignmentsError);
          return;
        }
        
        console.log('User assignments:', assignments);
        
        // For each team, fetch its members
        const teamsWithMembers = await Promise.all(assignments.map(async (assignment: any) => {
          const teamId = assignment.team_id;
          const teamName = assignment.teams?.name || 'Unnamed Team';
          const isAdmin = !!assignment.team_admin;
          
          console.log(`Fetching members for team ${teamName} (${teamId})`);
          
          // Get all members for this team (excluding current user)
          const { data: memberAssignments } = await supabase
            .from('team_assignments')
            .select('user_id, team_admin')
            .eq('team_id', teamId)
            .neq('user_id', user.id);

          const userIds = (memberAssignments || []).map((ma: any) => ma.user_id);

          let usersMap: Record<string, { id: string; name: string; email: string; avatar_url?: string }> = {};
          if (userIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('user_profiles_teammate_view')
              .select('user_id, display_name, avatar_url')
              .in('user_id', userIds);

            if (profilesData) {
              usersMap = profilesData.reduce((acc: any, u: any) => {
                acc[u.user_id] = { 
                  id: u.user_id, 
                  name: u.display_name || 'Unknown User',
                  email: '',
                  avatar_url: u.avatar_url
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
              joinedAt: new Date().toISOString(),
              availability: 'assigned',
              avatar: userInfo?.avatar_url || ''
            };
          });

          console.log(`Found ${members.length} actual members for team ${teamName}`);

          // Fetch collaborator configurations for this team
          const { data: configs, error: configError } = await supabase
            .from('collaborator_configurations')
            .select('*')
            .eq('team_id', teamId)
            .is('assigned_user_id', null);

          console.log(`Configs for team ${teamName}:`, configs, 'error:', configError);

          if (configs && configs.length > 0) {
            const configMembers: TeamMember[] = configs.map(config => ({
              id: config.id,
              name: `${config.role} (Needed)`,
              role: config.role,
              status: 'configured' as const,
              joinedAt: config.created_at,
              collaboratorTypes: config.collaborator_types,
              availability: 'unassigned',
              isConfiguration: true
            }));
            members.push(...configMembers);
            console.log(`Added ${configMembers.length} config members. Total: ${members.length}`);
          }

          return { id: teamId, name: teamName, members, isAdmin };
        }));
        
        console.log('Final teams with members:', teamsWithMembers);
        setUserTeams(teamsWithMembers);
      } catch (error) {
        console.error('Error fetching user teams:', error);
      }
    };
    fetchUserTeams();
  }, [user, refreshTrigger]);

  const handleInviteMember = async () => {
    if (!inviteRole || selectedCollaboratorTypes.length === 0) {
      toast({
        title: "Error",
        description: "Please select a role and at least one team role type.",
        variant: "destructive"
      });
      return;
    }

    if (inviteRole === "admin" && !isInviteTeamAdmin) {
      toast({
        title: "Not allowed",
        description: "Only team admins can assign the Admin role.",
        variant: "destructive"
      });
      return;
    }

    // If no email provided, save as a collaborator configuration
    if (!inviteEmail || !inviteEmail.trim()) {
      if (!activeTeamId) {
        toast({
          title: "Error",
          description: "No team selected. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      try {
        console.log('Creating config for team:', activeTeamId, 'role:', inviteRole);
        
        const { data, error } = await supabase
          .from('collaborator_configurations')
          .insert({
            team_id: activeTeamId,
            role: inviteRole,
            collaborator_types: selectedCollaboratorTypes,
            is_collaborator: inviteAttributes.coordinator,
            is_viewer: inviteAttributes.viewer,
          })
          .select();

        if (error) {
          console.error('Error creating config:', error);
          throw error;
        }
        
        console.log('Config created:', data);

        toast({
          title: "Success",
          description: `${inviteRole} role configured. You can now assign tasks to this role.`,
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = '/dashboard/project-management'}
            >
              Go to Tasks
            </Button>
          ),
        });
        
        setIsInviteDialogOpen(false);
        setInviteEmail("");
        setInviteRole("");
        setInviteAttributes({ coordinator: false, viewer: false });
        setSelectedCollaboratorTypes([]);
        
        // Trigger refresh of team data
        setRefreshTrigger(prev => prev + 1);
        return;
      } catch (error: any) {
        console.error('Error saving collaborator configuration:', error);
        toast({
          title: "Error",
          description: "Failed to save team role configuration. Please try again.",
          variant: "destructive"
        });
        return;
      }
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
          ? `${inviteEmail} has been added to your team. You can now assign tasks to them.`
          : `Invitation sent to ${inviteEmail} as ${inviteRole}. They will be available for task assignment once they join.`,
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.href = '/dashboard/project-management'}
          >
            Go to Tasks
          </Button>
        ),
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
      case 'configured': return 'bg-purple-500';
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

  const createTeamReady =
    Boolean(teamName.trim()) && teamCollaboratorTypes.length > 0 && Boolean(user);

  const handleCreateTeam = async () => {
    if (isCreatingTeam) return;
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
        description: "Please select at least one team role type.",
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

    setIsCreatingTeam(true);
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
        description: `Team "${teamName}" created with role types: ${teamCollaboratorTypes.join(", ")}.`,
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
    } finally {
      setIsCreatingTeam(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Team Members
          </h1>
          <p className="text-muted-foreground">
            Invite team members, assign roles, and coordinate on events
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button type="button" variant="outline" asChild>
            <Link to="/dashboard/manage-event">Manage Event</Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/dashboard/project-management">Project Management</Link>
          </Button>
        </div>

        {/* Create Team Dialog */}
        <Dialog 
          open={isCreateTeamDialogOpen} 
          onOpenChange={(open) => {
            setIsCreateTeamDialogOpen(open);
            if (!open) {
              setTeamName("");
              setTeamCollaboratorTypes([]);
              setIsCreatingTeam(false);
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
                <label className="text-sm font-medium">Team role types (select all that apply)</label>
                <div className="mt-2 max-h-48 overflow-y-auto space-y-2 border rounded-md p-3 bg-background">
                  {COLLABORATOR_TYPE_OPTIONS.map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={teamCollaboratorTypes.includes(value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTeamCollaboratorTypes([...teamCollaboratorTypes, value]);
                          } else {
                            setTeamCollaboratorTypes(teamCollaboratorTypes.filter(t => t !== value));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button
                type="button"
                disabled={!createTeamReady || isCreatingTeam}
                onClick={handleCreateTeam}
                className="w-full"
              >
                {isCreatingTeam ? "Creating Team…" : "Create Team"}
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
                    <AvatarWithBrandFallback
                      className="w-16 h-16"
                      src={selectedMember.avatar}
                      alt={selectedMember.name}
                      displayName={selectedMember.name}
                      fallbackClassName="text-xl"
                    />
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

        {/* Invite Member Dialog */}
        <Dialog 
          open={isInviteDialogOpen} 
          onOpenChange={(open) => {
            setIsInviteDialogOpen(open);
            if (!open) {
              setInviteEmail("");
              setInviteRole("");
              setInviteAttributes({ coordinator: false, viewer: false });
              setSelectedCollaboratorTypes([]);
            }
          }}
        >
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email Address (Optional)</label>
                <Input
                  type="email"
                  placeholder="Enter email address (optional)"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {isInviteTeamAdmin && (
                      <SelectItem value="admin">Admin</SelectItem>
                    )}
                    <SelectItem value="organizer">Organizer</SelectItem>
                    <SelectItem value="coordinator">Coordinator</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Team role types (select all that apply)</label>
                <div className="mt-2 max-h-48 overflow-y-auto space-y-2 border rounded-md p-3 bg-background">
                  {COLLABORATOR_TYPE_OPTIONS.map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedCollaboratorTypes.includes(value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCollaboratorTypes([...selectedCollaboratorTypes, value]);
                          } else {
                            setSelectedCollaboratorTypes(selectedCollaboratorTypes.filter(t => t !== value));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <Button onClick={handleInviteMember} className="w-full">
                Send Invitation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={handleCollaborateTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team directory</CardTitle>
              <CardDescription>
                Team is a roster view: member name, availability status (assigned or unassigned), and collaborator type.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Members</p>
                <p className="text-xl font-semibold">{teamMembers.filter((m) => !m.isConfiguration).length}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Assigned</p>
                <p className="text-xl font-semibold">
                  {teamMembers.filter((m) => (m.availability ?? "assigned") === "assigned").length}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Unassigned</p>
                <p className="text-xl font-semibold">
                  {teamMembers.filter((m) => (m.availability ?? "assigned") === "unassigned").length}
                </p>
              </div>
            </CardContent>
          </Card>

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
                      onInviteMember={() => openInviteDialog(team.id)}
                    />
                  ) : (
                    <>
                      {team.isAdmin && (
                        <div className="py-4">
                          <Button 
                            onClick={() => openInviteDialog(team.id)}
                            className="bg-gradient-to-r from-primary to-secondary"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite Member
                          </Button>
                        </div>
                      )}
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 py-4">
                        {team.members.map((member) => (
                          <TeamMemberCard
                            key={member.id}
                            member={member}
                            onClick={handleMemberClick}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {userTeams.length === 0 &&
            (teamMembers.length === 0 ? (
              <NoTeamMembersCard
                userTeam={userTeam}
                userTeams={userTeams}
                onCreateTeam={() => setIsCreateTeamDialogOpen(true)}
                onInviteMember={() => openInviteDialog()}
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
            ))}
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Files &amp; team discussions
              </CardTitle>
              <CardDescription>
                Upload and share documents on discussion posts in the Team Communication Hub.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/dashboard/comments?hub=files">
                  Shared files for this event
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/dashboard/comments">Open communication hub</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
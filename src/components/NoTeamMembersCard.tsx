import { Card, CardContent } from "@/components/ui/card";
import { Users, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoTeamMembersCardProps {
  userTeam: { id: string; name: string } | null;
  userTeams: { id: string; name: string; members: any[]; isAdmin: boolean }[];
  onCreateTeam: () => void;
  onInviteMember: () => void;
}

export function NoTeamMembersCard({ userTeam, userTeams, onCreateTeam, onInviteMember }: NoTeamMembersCardProps) {
  const showCreateOnly = !userTeam && userTeams.length > 0;
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Users className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Team Members Yet</h3>
        <p className="text-muted-foreground text-center mb-4 max-w-md">
          {!userTeam
            ? "You don't belong to any team. Start by creating a team and inviting team members to collaborate on your events."
            : `${userTeam.name} has no members. Start by inviting team members who you can assign to tasks.`}
        </p>
        <div className="flex gap-3">
          {(!userTeam || showCreateOnly) && (
            <Button 
              onClick={onCreateTeam}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          )}
          {!showCreateOnly && userTeam && (
            <Button 
              onClick={onInviteMember}
              className="bg-gradient-to-r from-primary to-secondary shadow-lg hover:shadow-xl transition-shadow"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite for Tasks
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Users, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoTeamMembersCardProps {
  userTeam: { id: string; name: string } | null;
  onCreateTeam: () => void;
  onInviteMember: () => void;
}

export function NoTeamMembersCard({ userTeam, onCreateTeam, onInviteMember }: NoTeamMembersCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Users className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Team Members Yet</h3>
        <p className="text-muted-foreground text-center mb-4 max-w-md">
          {!userTeam
            ? "You don't belong to any team. Start by creating a team and inviting team members to collaborate on your events."
            : "Your team has no members. Start by inviting team members to collaborate on your events."}
        </p>
        <div className="flex gap-3">
          {!userTeam && (
            <Button 
              onClick={onCreateTeam}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          )}
          <Button 
            onClick={onInviteMember}
            variant="outline"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AvatarWithBrandFallback } from "@/components/AvatarWithBrandFallback";
import { TeamMember } from "../pages/Collaborate";

interface TeamMemberCardProps {
  member: TeamMember;
  onClick?: (member: TeamMember) => void;
}

export function TeamMemberCard({ member, onClick }: TeamMemberCardProps) {
  function getStatusColor(status: string) {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      case 'invited': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  }
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick && onClick(member)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <AvatarWithBrandFallback
              src={member.avatar}
              alt=""
              displayName={member.name}
              className="h-10 w-10"
              fallbackClassName="text-xs"
            />
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{member.name}</h3>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Badge variant="secondary">{member.role.replace('_', ' ')}</Badge>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Availability:</span>
            <Badge variant={(member.availability ?? "assigned") === "assigned" ? "default" : "outline"}>
              {member.availability ?? "assigned"}
            </Badge>
          </div>
          {member.collaboratorTypes && member.collaboratorTypes.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Collaborator type: {member.collaboratorTypes.join(", ")}
            </p>
          ) : null}
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(member.status)}`} />
            <span className="capitalize">{member.status}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

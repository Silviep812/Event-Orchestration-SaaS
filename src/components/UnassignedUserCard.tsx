import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PermissionLevel } from "@/lib/permissions";
import { eventSelectLifecycleLabel } from "@/lib/eventStatus";

interface Event {
  id: string;
  title: string;
  start_date?: string;
  end_date?: string | null;
  status?: string | null;
  archived?: boolean | null;
}

interface UnassignedUserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  roles: Array<{ value: string; label: string; description: string }>;
  events: Event[];
  permissionLevels: Record<string, { label: string; description: string }>;
  permissionMappings: Map<string, PermissionLevel>;
  onAssign: (userId: string, role: string, permissionLevel: PermissionLevel, eventId: string | null) => void;
}

export function UnassignedUserCard({ 
  user, 
  roles, 
  events,
  permissionLevels, 
  permissionMappings, 
  onAssign 
}: UnassignedUserCardProps) {
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<PermissionLevel>('viewer');
  const [selectedEvent, setSelectedEvent] = useState<string>('global');

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h4 className="font-semibold">{user.name || 'Unknown User'}</h4>
                {user.email && (
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                )}
              </div>
              <Badge variant="outline" className="text-muted-foreground">
                No Role Assigned
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Event</label>
              <Select
                value={selectedEvent}
                onValueChange={setSelectedEvent}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (All Events)</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title || `Event ${event.id.slice(0, 8)}`}
                      <span className="text-muted-foreground">{` · ${eventSelectLifecycleLabel(event)}`}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Role</label>
              <Select
                value={selectedRole}
                onValueChange={(role) => {
                  setSelectedRole(role);
                  const suggested = permissionMappings.get(role) || 'viewer';
                  setSelectedPermission(suggested);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">
                Permission Level
                {permissionMappings.get(selectedRole) === selectedPermission && (
                  <span className="text-xs text-muted-foreground ml-1">(suggested)</span>
                )}
              </label>
              <Select
                value={selectedPermission}
                onValueChange={(perm) => setSelectedPermission(perm as PermissionLevel)}
                disabled={!selectedRole}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(permissionLevels).map(([key, level]) => (
                    <SelectItem key={key} value={key}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <button
              onClick={() => {
                if (selectedRole) {
                  const finalEventId = selectedEvent === 'global' ? null : selectedEvent;
                  onAssign(user.id, selectedRole, selectedPermission, finalEventId);
                }
              }}
              disabled={!selectedRole}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed mt-5"
            >
              Assign
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

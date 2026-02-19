import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { PermissionLevel } from "@/lib/permissions";

interface Event {
  id: string;
  title: string;
  start_date: string;
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
  selectedEventFilter?: string;
  onAssign: (userId: string, role: string, permissionLevel: PermissionLevel, eventId: string | null) => void;
}

export function UnassignedUserCard({ 
  user, 
  roles, 
  events,
  permissionLevels, 
  permissionMappings,
  selectedEventFilter,
  onAssign 
}: UnassignedUserCardProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedPermission, setSelectedPermission] = useState<PermissionLevel>('viewer');
  const [selectedEvent, setSelectedEvent] = useState<string>(
    selectedEventFilter && selectedEventFilter !== "all" ? selectedEventFilter : 'global'
  );
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (selectedEventFilter && selectedEventFilter !== "all") {
      setSelectedEvent(selectedEventFilter);
    } else if (selectedEventFilter === "all") {
      setSelectedEvent('global');
    }
  }, [selectedEventFilter]);

  const toggleRole = (roleValue: string) => {
    setSelectedRoles(prev => {
      const next = prev.includes(roleValue)
        ? prev.filter(r => r !== roleValue)
        : [...prev, roleValue];
      // Update permission to suggested for the last toggled role
      if (!prev.includes(roleValue)) {
        const suggested = permissionMappings.get(roleValue) || 'viewer';
        setSelectedPermission(suggested);
      }
      return next;
    });
  };

  const handleAssign = async () => {
    if (selectedRoles.length === 0) return;
    setIsAssigning(true);
    const finalEventId = selectedEvent === 'global' ? null : selectedEvent;
    for (const role of selectedRoles) {
      const perm = permissionMappings.get(role) || selectedPermission;
      await onAssign(user.id, role, perm, finalEventId);
    }
    setSelectedRoles([]);
    setIsAssigning(false);
  };

  const selectedLabels = selectedRoles.map(r => roles.find(role => role.value === r)?.label).filter(Boolean);

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
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Role Types (select all that apply)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    <span className="truncate">
                      {selectedLabels.length > 0 
                        ? selectedLabels.length <= 2 
                          ? selectedLabels.join(', ')
                          : `${selectedLabels.length} roles selected`
                        : 'Select roles...'}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-2 bg-popover z-50" align="start">
                  <div className="space-y-1">
                    {roles.map((role) => (
                      <label
                        key={role.value}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer text-sm"
                      >
                        <Checkbox
                          checked={selectedRoles.includes(role.value)}
                          onCheckedChange={() => toggleRole(role.value)}
                        />
                        {role.label}
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Permission Level</label>
              <Select
                value={selectedPermission}
                onValueChange={(perm) => setSelectedPermission(perm as PermissionLevel)}
                disabled={selectedRoles.length === 0}
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
              onClick={handleAssign}
              disabled={selectedRoles.length === 0 || isAssigning}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed mt-5"
            >
              {isAssigning ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

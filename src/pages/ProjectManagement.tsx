import { TaskManager } from "@/components/TaskManager";
import { BudgetTracker } from "@/components/BudgetTracker";
import { RoleManager } from "@/components/RoleManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEventFilter } from "@/hooks/useEventFilter";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Clock, DollarSign, Users, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export default function ProjectManagement() {
  const { selectedEventFilter, setSelectedEventFilter, events } = useEventFilter();
  const { toast } = useToast();
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleRecalculateTimeline = async () => {
    if (!selectedEventFilter || selectedEventFilter === 'all') {
      toast({
        title: "Event required",
        description: "Please select a specific event to recalculate the timeline.",
        variant: "destructive",
      });
      return;
    }

    setIsRecalculating(true);
    try {
      const { data, error } = await supabase.rpc('recalculate_downstream_tasks', {
        p_task_id: null,
        p_event_id: selectedEventFilter
      });

      if (error) throw error;

      toast({
        title: "Timeline recalculated",
        description: data && data.length > 0 
          ? `Updated ${data.length} task${data.length > 1 ? 's' : ''} in the timeline.`
          : "Timeline recalculated successfully.",
      });
    } catch (error) {
      console.error('Error recalculating timeline:', error);
      toast({
        title: "Error",
        description: "Failed to recalculate timeline. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Management</h1>
          <p className="text-muted-foreground">
            Manage tasks, track budgets, and assign roles for your events
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Label htmlFor="event-filter" className="text-sm font-medium">
            Filter by Event:
          </Label>
          <Select value={selectedEventFilter} onValueChange={setSelectedEventFilter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select an event to filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title} {event.start_date && `(${format(new Date(event.start_date), 'MMM d, yyyy')})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedEventFilter && selectedEventFilter !== 'all' && (
            <Button
              onClick={handleRecalculateTimeline}
              disabled={isRecalculating}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
              {isRecalculating ? 'Recalculating...' : 'Recalculate Timeline'}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <TaskManager selectedEventFilter={selectedEventFilter} />
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <BudgetTracker selectedEventFilter={selectedEventFilter} />
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <RoleManager selectedEventFilter={selectedEventFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
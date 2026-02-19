import { TaskManager } from "@/components/TaskManager";
import { BudgetTracker } from "@/components/BudgetTracker";
import { RoleManager } from "@/components/RoleManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEventFilter } from "@/hooks/useEventFilter";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, DollarSign, Users, RefreshCw, LayoutDashboard } from "lucide-react";
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
      const { data, error } = await supabase.rpc('recalculate_project_timeline', {
        p_event_id: selectedEventFilter
      });

      if (error) throw error;

      toast({
        title: "Timeline recalculated",
        description: data && Array.isArray(data) && data.length > 0 
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

  const selectedEvent = events.find(e => e.id === selectedEventFilter);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <LayoutDashboard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Project Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage tasks, budgets, and collaborators for your events
            </p>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border bg-card">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Event:</span>
            <Select value={selectedEventFilter} onValueChange={setSelectedEventFilter}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Select an event" />
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
          </div>

          {selectedEventFilter && selectedEventFilter !== 'all' && (
            <Button
              onClick={handleRecalculateTimeline}
              disabled={isRecalculating}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <RefreshCw className={`h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
              {isRecalculating ? 'Recalculating...' : 'Recalculate Timeline'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-11">
          <TabsTrigger value="tasks" className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Budget</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Collaborators</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4 overflow-hidden">
          <TaskManager selectedEventFilter={selectedEventFilter} />
        </TabsContent>

        <TabsContent value="budget" className="space-y-4 overflow-hidden">
          <BudgetTracker selectedEventFilter={selectedEventFilter} />
        </TabsContent>

        <TabsContent value="roles" className="space-y-4 overflow-hidden">
          <RoleManager selectedEventFilter={selectedEventFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

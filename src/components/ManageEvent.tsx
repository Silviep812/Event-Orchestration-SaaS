import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, Clock, Plus, Save, AlertCircle, History, Eye, Trash2, Calendar as CalendarIcon, Package, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import TimelineView from "@/components/timeline/TimelineView";
import ResourceManager from "@/components/ResourceManager";
import Analytics from "@/components/Analytics";

interface ManageEventData {
  id?: string;
  event_user_id: string;
  event_contact_name?: string;
  event_contact_email?: string;
  event_contact_ph_nbr?: number;
  event_date?: string;
  event_time?: string;
  event_type?: string;
  event_theme?: string;
  event_status?: string;
  set_priority?: string;
  task_status?: string;
  created_at?: string;
}

interface ChangeLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  change_description?: string;
  created_at: string;
  changed_by: string;
}

interface NewRequest {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'change_request' | 'new_requirement' | 'issue';
}

const ManageEvent = () => {
  const [events, setEvents] = useState<ManageEventData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ManageEventData | null>(null);
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [newRequestDialog, setNewRequestDialog] = useState(false);
  const [newRequest, setNewRequest] = useState<NewRequest>({
    title: '',
    description: '',
    priority: 'medium',
    type: 'change_request'
  });
  const { toast } = useToast();

  // Auto-save debounce
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('Manage Event')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchChangeLogs = async (entityId: string) => {
    try {
      const { data, error } = await supabase
        .from('change_logs')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', 'event')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChangeLogs(data || []);
    } catch (error) {
      console.error('Error fetching change logs:', error);
    }
  };

  const saveEvent = async (eventData: ManageEventData, isManual = false) => {
    console.log('Save event called with:', eventData);
    
    if (isManual) {
      toast({
        title: "Info",
        description: "Save functionality will be implemented after database setup",
      });
    }
    
    // Log the change attempt
    try {
      await supabase.rpc('log_change', {
        p_entity_type: 'event',
        p_entity_id: eventData.id,
        p_action: 'updated',
        p_description: isManual ? 'Manual save attempted' : 'Auto-save attempted'
      });
    } catch (error) {
      console.error('Error logging change:', error);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    if (!selectedEvent) return;

    const updatedEvent = { ...selectedEvent, [field]: value };
    setSelectedEvent(updatedEvent);

    // Update in events list
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));

    // Auto-save logic
    if (autoSave) {
      if (saveTimeout) clearTimeout(saveTimeout);
      const timeout = setTimeout(() => {
        saveEvent(updatedEvent, false);
      }, 1000); // 1 second debounce
      setSaveTimeout(timeout);
    }
  };

  const submitNewRequest = async () => {
    try {
      // Notify coordinators
      await supabase.rpc('notify_coordinators', {
        p_title: `New ${newRequest.type.replace('_', ' ')}: ${newRequest.title}`,
        p_message: newRequest.description,
        p_type: 'new_request',
        p_entity_type: selectedEvent ? 'event' : null,
        p_entity_id: selectedEvent?.id || null
      });

      toast({
        title: "Request Submitted",
        description: "Your request has been sent to coordinators",
      });

      setNewRequestDialog(false);
      setNewRequest({
        title: '',
        description: '',
        priority: 'medium',
        type: 'change_request'
      });
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Failed to submit request",
        variant: "destructive",
      });
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    const eventsChannel = supabase
      .channel('manage-events-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'Manage Event' 
      }, () => {
        fetchEvents();
      })
      .subscribe();

    const changeLogsChannel = supabase
      .channel('change-logs-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'change_logs' 
      }, () => {
        if (selectedEvent?.id) {
          fetchChangeLogs(selectedEvent.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(changeLogsChannel);
    };
  }, [selectedEvent?.id]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent?.id) {
      fetchChangeLogs(selectedEvent.id);
    }
  }, [selectedEvent?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Manage Events
          </h1>
          <p className="text-muted-foreground">
            Real-time event management with change tracking
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button 
            onClick={() => window.location.href = '/dashboard/create-event'}
            className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Managed Event
          </Button>
          
          <div className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              id="autosave"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="autosave">Auto-save</label>
          </div>
          
          <Dialog open={newRequestDialog} onOpenChange={setNewRequestDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Submit New Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="request-title">Title</Label>
                  <Input
                    id="request-title"
                    value={newRequest.title}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description of request"
                  />
                </div>
                
                <div>
                  <Label htmlFor="request-type">Type</Label>
                  <Select
                    value={newRequest.type}
                    onValueChange={(value: NewRequest['type']) => 
                      setNewRequest(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="change_request">Change Request</SelectItem>
                      <SelectItem value="new_requirement">New Requirement</SelectItem>
                      <SelectItem value="issue">Issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="request-priority">Priority</Label>
                  <Select
                    value={newRequest.priority}
                    onValueChange={(value: NewRequest['priority']) => 
                      setNewRequest(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="request-description">Description</Label>
                  <Textarea
                    id="request-description"
                    value={newRequest.description}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of the request"
                    rows={4}
                  />
                </div>
                
                <Button 
                  onClick={submitNewRequest}
                  className="w-full bg-gradient-primary hover:opacity-90"
                  disabled={!newRequest.title || !newRequest.description}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Submit & Notify Coordinators
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events List */}
        <Card className="lg:col-span-1 shadow-elegant border-0 bg-gradient-subtle">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Events
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {events.map((event, index) => (
                <div
                  key={event.id || index}
                  className={`p-4 border-b border-border/30 cursor-pointer transition-all hover:bg-surface/50 ${
                    selectedEvent?.id === event.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                  }`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="font-medium text-sm truncate">
                    {event.event_contact_name || 'Unnamed Event'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {event.event_type} • {event.event_status}
                  </div>
                  {event.event_date && (
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(event.event_date), 'MMM dd, yyyy')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Event Details & Change Logs */}
        <div className="lg:col-span-2 space-y-6">
          {selectedEvent ? (
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="resources" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Resources
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="changelog" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Change Log ({changeLogs.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card className="shadow-elegant border-0 bg-gradient-subtle">
                  <CardHeader className="border-b border-border/50">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <CardTitle>Event Details</CardTitle>
                      <div className="flex items-center gap-2">
                        {saving && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            Saving...
                          </div>
                        )}
                        {!autoSave && (
                          <Button
                            onClick={() => selectedEvent && saveEvent(selectedEvent, true)}
                            size="sm"
                            disabled={saving}
                            className="bg-gradient-primary hover:opacity-90"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact-name">Contact Name</Label>
                        <Input
                          id="contact-name"
                          value={selectedEvent.event_contact_name || ''}
                          onChange={(e) => handleFieldChange('event_contact_name', e.target.value)}
                          placeholder="Enter contact name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="contact-email">Contact Email</Label>
                        <Input
                          id="contact-email"
                          type="email"
                          value={selectedEvent.event_contact_email || ''}
                          onChange={(e) => handleFieldChange('event_contact_email', e.target.value)}
                          placeholder="Enter contact email"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="contact-phone">Contact Phone</Label>
                        <Input
                          id="contact-phone"
                          type="tel"
                          value={selectedEvent.event_contact_ph_nbr || ''}
                          onChange={(e) => handleFieldChange('event_contact_ph_nbr', e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="Enter contact phone"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="event-type">Event Type</Label>
                        <Input
                          id="event-type"
                          value={selectedEvent.event_type || ''}
                          onChange={(e) => handleFieldChange('event_type', e.target.value)}
                          placeholder="Enter event type"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="event-date">Event Date</Label>
                        <Input
                          id="event-date"
                          type="date"
                          value={selectedEvent.event_date || ''}
                          onChange={(e) => handleFieldChange('event_date', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="event-time">Event Time</Label>
                        <Input
                          id="event-time"
                          type="time"
                          value={selectedEvent.event_time ? selectedEvent.event_time.slice(0, 5) : ''}
                          onChange={(e) => handleFieldChange('event_time', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="event-status">Event Status</Label>
                        <Select
                          value={selectedEvent.event_status || ''}
                          onValueChange={(value) => handleFieldChange('event_status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planning">Planning</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          value={selectedEvent.set_priority || ''}
                          onValueChange={(value) => handleFieldChange('set_priority', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor="event-theme">Event Theme</Label>
                        <Input
                          id="event-theme"
                          value={selectedEvent.event_theme || ''}
                          onChange={(e) => handleFieldChange('event_theme', e.target.value)}
                          placeholder="Enter event theme"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline">
                <Card className="shadow-elegant border-0 bg-gradient-subtle">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle>Timeline & Task Management</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <TimelineView eventId={selectedEvent.id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resources">
                <Card className="shadow-elegant border-0 bg-gradient-subtle">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle>Resource Management</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResourceManager eventId={selectedEvent.id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <Analytics 
                  onInteractionTrack={(interaction) => {
                    console.log('User interaction tracked:', interaction);
                  }}
                />
              </TabsContent>

              <TabsContent value="changelog">
                <Card className="shadow-elegant border-0 bg-gradient-subtle">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle>Change History</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto">
                      {changeLogs.length > 0 ? (
                        changeLogs.map((log) => (
                          <div key={log.id} className="p-4 border-b border-border/30">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {log.action}
                                  </Badge>
                                  {log.field_name && (
                                    <span className="text-xs text-muted-foreground">
                                      {log.field_name}
                                    </span>
                                  )}
                                </div>
                                {log.change_description && (
                                  <p className="text-sm text-foreground mb-2">
                                    {log.change_description}
                                  </p>
                                )}
                                {log.old_value && log.new_value && (
                                  <div className="text-xs space-y-1">
                                    <div className="text-red-600">
                                      Old: {log.old_value}
                                    </div>
                                    <div className="text-green-600">
                                      New: {log.new_value}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground text-right">
                                {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No changes recorded yet</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="shadow-elegant border-0 bg-gradient-subtle">
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Event Selected</h3>
                <p className="text-muted-foreground">
                  Select an event from the list to view and manage its details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageEvent;
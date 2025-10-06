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
import { useAuth } from "@/hooks/useAuth";
import { Bell, Clock, Plus, Save, AlertCircle, History, Eye, Trash2, Calendar as CalendarIcon, Package, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import TimelineView from "@/components/timeline/TimelineView";
import ResourceManager from "@/components/ResourceManager";
import Analytics from "@/components/Analytics";

interface ManageEventData {
  id?: string;
  user_id: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  theme_id?: number;
  type_id?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  budget?: number;
  created_at?: string;
  updated_at?: string;
  venue?: string;
}

interface EventTheme {
  id: number;
  name: string;
  premium: boolean;
}

interface EventType {
  id: number;
  name: string;
  theme_id: number;
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
  const [pendingChanges, setPendingChanges] = useState<{[key: string]: {oldValue: any, newValue: any}}>({});
  const [newRequestDialog, setNewRequestDialog] = useState(false);
  const [newRequest, setNewRequest] = useState<NewRequest>({
    title: '',
    description: '',
    priority: 'medium',
    type: 'change_request'
  });
  const [eventThemes, setEventThemes] = useState<EventTheme[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  // Auto-save debounce
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [budgetInput, setBudgetInput] = useState<string>('');

  // Resource sync trigger
  const [resourceRefreshKey, setResourceRefreshKey] = useState(0);

  // Sync details to resources
  const syncDetailsToResources = async (eventData: ManageEventData) => {
    if (!eventData.id) {
      console.log('syncDetailsToResources: No event ID');
      return;
    }

    console.log('syncDetailsToResources: Starting sync for event', eventData.id, 'with location', eventData.location);

    try {
      // Fetch resource categories
      const { data: categories, error: catError } = await supabase
        .from('resource_categories')
        .select('id, name');
      
      if (catError) {
        console.error('syncDetailsToResources: Error fetching categories', catError);
        throw catError;
      }
      
      if (!categories) {
        console.log('syncDetailsToResources: No categories found');
        return;
      }

      // Find category IDs
      const venueCategory = categories.find(c => c.name.toLowerCase().includes('venue'));
      const { data: statusAvailable, error: statusError } = await supabase
        .from('resource_status')
        .select('id')
        .ilike('name', '%available%')
        .single();

      if (statusError) {
        console.error('syncDetailsToResources: Error fetching status', statusError);
      }

      // Auto-create venue resource if venue is set
      if (eventData.venue && venueCategory) {
        console.log('syncDetailsToResources: Checking for existing venue resource');
        const { data: existingVenue, error: venueError } = await supabase
          .from('resources')
          .select('id')
          .eq('event_id', eventData.id)
          .eq('category_id', venueCategory.id)
          .maybeSingle();

        if (venueError) {
          console.error('syncDetailsToResources: Error checking venue', venueError);
        }

        if (!existingVenue) {
          console.log('syncDetailsToResources: Creating new venue resource');
          const { error: insertError } = await supabase.from('resources').insert({
            name: eventData.venue,
            category_id: venueCategory.id,
            status_id: statusAvailable?.id || 1,
            location: eventData.location || '',
            allocated: 1,
            total: 1,
            event_id: eventData.id,
          });
          if (insertError) {
            console.error('syncDetailsToResources: Error inserting venue', insertError);
          } else {
            console.log('syncDetailsToResources: Venue resource created successfully');
          }
        } else {
          console.log('syncDetailsToResources: Updating existing venue resource');
          const { error: updateError } = await supabase
            .from('resources')
            .update({
              name: eventData.venue,
              location: eventData.location || '',
            })
            .eq('id', existingVenue.id);
          if (updateError) {
            console.error('syncDetailsToResources: Error updating venue', updateError);
          } else {
            console.log('syncDetailsToResources: Venue resource updated successfully');
          }
        }
      }

      // Update all resources with the event location
      if (eventData.location) {
        console.log('syncDetailsToResources: Updating all resources location to', eventData.location);
        const { data: updateResult, error: updateError } = await supabase
          .from('resources')
          .update({ location: eventData.location })
          .eq('event_id', eventData.id)
          .select();

        if (updateError) {
          console.error('syncDetailsToResources: Error updating resources location', updateError);
          throw updateError;
        } else {
          console.log('syncDetailsToResources: Successfully updated', updateResult?.length || 0, 'resources');
        }
      }

      // Trigger resource refresh
      console.log('syncDetailsToResources: Triggering resource refresh');
      setResourceRefreshKey(prev => prev + 1);
      
      console.log('syncDetailsToResources: Sync completed successfully');
    } catch (error) {
      console.error('syncDetailsToResources: Fatal error during sync', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync location to resources",
        variant: "destructive",
      });
    }
  };

  const fetchEvents = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const transformedData = data.map(event => ({
        ...event,
        theme_id: event.theme_id ? Number(event.theme_id) : undefined
      }));
      setEvents(transformedData);
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

  const fetchThemes = async () => {
    try {
      const { data, error } = await supabase
        .from('event_themes')
        .select('id, name, premium')
        .order('name');
      
      if (error) throw error;
      setEventThemes(data || []);
    } catch (error) {
      console.error('Error fetching themes:', error);
    }
  };

  const fetchEventTypes = async (themeId?: number) => {
    try {
      let query = supabase
        .from('event_types')
        .select('id, name, theme_id')
        .order('name');
      
      if (themeId) {
        query = query.eq('theme_id', themeId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setEventTypes(data || []);
    } catch (error) {
      console.error('Error fetching event types:', error);
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
    if (!eventData.id) return;

    // Date validation
    if (eventData.start_date && eventData.end_date) {
      const start = new Date(eventData.start_date);
      const end = new Date(eventData.end_date);
      if (end < start) {
        toast({
          title: "Invalid Dates",
          description: "End date cannot be before start date.",
          variant: "destructive",
        });
        return;
      }
      if (start > end) {
        toast({
          title: "Invalid Dates",
          description: "Start date cannot be after end date.",
          variant: "destructive",
        });
        return;
      }
    } else if (eventData.end_date && !eventData.start_date) {
      toast({
        title: "Invalid Dates",
        description: "Start date is required if end date is set.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('events')
        .update({
          title: eventData.title,
          description: eventData.description,
          start_date: eventData.start_date,
          end_date: eventData.end_date,
          start_time: eventData.start_time,
          end_time: eventData.end_time,
          location: eventData.location,
          venue: eventData.venue,
          theme_id: eventData.theme_id,
          type_id: eventData.type_id,
          status: eventData.status,
          budget: eventData.budget,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventData.id);

      if (error) throw error;

      // Sync details to resources after successful save
      await syncDetailsToResources(eventData);

      if (isManual) {
        toast({
          title: "Success",
          description: "Event saved successfully",
        });
        
        // Log individual field changes when manually saving
        for (const [field, change] of Object.entries(pendingChanges)) {
          await supabase.rpc('log_change', {
            p_entity_type: 'event',
            p_entity_id: eventData.id,
            p_action: 'updated',
            p_field_name: field,
            p_old_value: change.oldValue?.toString() || null,
            p_new_value: change.newValue?.toString() || null,
            p_description: `Manual save: ${field} updated`
          });
        }
        
        // Clear pending changes after manual save
        setPendingChanges({});
      }
      
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: "Failed to save event",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = async (field: string, value: any) => {
    if (!selectedEvent) return;

    // Trial version date restriction
    if ((field === 'start_date' || field === 'end_date') && value) {
      const trialEnd = new Date('2025-12-31T23:59:59');
      const newDate = new Date(value);
      if (newDate > trialEnd) {
        toast({
          title: "Trial Limitation",
          description: "The trial version doesn't allow events with dates after December 31st, 2025.",
          variant: "destructive",
        });
        return;
      }
    }

    // Capture old value for logging
    const oldValue = selectedEvent[field as keyof ManageEventData];
    
    // Only proceed if value actually changed
    if (oldValue === value) return;

    const updatedEvent = { ...selectedEvent, [field]: value };
    setSelectedEvent(updatedEvent);

    // Update in events list
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));

    // Immediate sync for location or venue changes
    if ((field === 'location' || field === 'venue') && selectedEvent.id) {
      console.log(`Field ${field} changed, syncing to resources immediately`);
      
      // Update all resources with new location
      if (field === 'location' && value) {
        const { error } = await supabase
          .from('resources')
          .update({ location: value })
          .eq('event_id', selectedEvent.id);
        
        if (error) {
          console.error('Error updating resources location:', error);
        } else {
          console.log('Resources location updated successfully');
          setResourceRefreshKey(prev => prev + 1);
        }
      }
      
      // Update venue resource if venue changed
      if (field === 'venue' && value) {
        const { data: categories } = await supabase
          .from('resource_categories')
          .select('id, name');
        
        const venueCategory = categories?.find(c => c.name.toLowerCase().includes('venue'));
        
        if (venueCategory) {
          const { data: existingVenue } = await supabase
            .from('resources')
            .select('id')
            .eq('event_id', selectedEvent.id)
            .eq('category_id', venueCategory.id)
            .maybeSingle();
          
          if (existingVenue) {
            await supabase
              .from('resources')
              .update({ 
                name: value,
                location: updatedEvent.location || ''
              })
              .eq('id', existingVenue.id);
          }
          setResourceRefreshKey(prev => prev + 1);
        }
      }
    }

    // Log field change for audit trail
    if (selectedEvent.id) {
      if (autoSave) {
        // For auto-save, log immediately
        try {
          await supabase.rpc('log_change', {
            p_entity_type: 'event',
            p_entity_id: selectedEvent.id,
            p_action: 'updated',
            p_field_name: field,
            p_old_value: oldValue?.toString() || null,
            p_new_value: value?.toString() || null,
            p_description: `Field "${field}" updated from "${oldValue || 'empty'}" to "${value || 'empty'}"`
          });
        } catch (error) {
          console.error('Error logging field change:', error);
        }
      } else {
        // For manual save, track pending changes
        setPendingChanges(prev => ({
          ...prev,
          [field]: {
            oldValue: oldValue,
            newValue: value
          }
        }));
      }
    }

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

  // Helper to map status value to display string
  const getStatusDisplay = (status: string | undefined) => {
    if (!status) return '';
    if (status === 'in_progress') return 'in progress';
    return status.replace('_', ' ');
  };

  // Real-time subscriptions
  useEffect(() => {
    const eventsChannel = supabase
      .channel('manage-events-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'events' 
      }, (payload) => {
        console.log('Event change detected:', payload);
        fetchEvents();
        // Trigger resource refresh when event is updated
        if (payload.eventType === 'UPDATE' && selectedEvent?.id === payload.new?.id) {
          setResourceRefreshKey(prev => prev + 1);
        }
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
    if (user) {
      fetchEvents();
      fetchThemes();
      fetchEventTypes();
    }
  }, [selectedEvent?.theme_id]);

  useEffect(() => {
    if (selectedEvent?.id) {
      fetchChangeLogs(selectedEvent.id);
    }
  }, [selectedEvent?.id]);

  // Sync budget input with selectedEvent.budget
  useEffect(() => {
    if (selectedEvent && selectedEvent.budget !== undefined && selectedEvent.budget !== null) {
      setBudgetInput(Number(selectedEvent.budget).toFixed(2));
    } else {
      setBudgetInput('');
    }
  }, [selectedEvent?.budget]);

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
                    {event.title || 'Unnamed Event'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getStatusDisplay(event.status)}
                  </div>
                  {event.start_date && (
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(event.start_date + 'T00:00:00'), 'MMM dd, yyyy')}
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
                            className="hover:opacity-90"
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
                        <Label htmlFor="title">Event Title</Label>
                        <Input
                          id="title"
                          value={selectedEvent.title || ''}
                          onChange={(e) => handleFieldChange('title', e.target.value)}
                          placeholder="Enter event title"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="status">Event Status</Label>
                        <Select
                          value={selectedEvent.status || ''}
                          onValueChange={(value) => handleFieldChange('status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={selectedEvent.start_date || ''}
                          onChange={(e) => handleFieldChange('start_date', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="end-date">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={selectedEvent.end_date || ''}
                          onChange={(e) => handleFieldChange('end_date', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="start-time">Start Time</Label>
                        <Input
                          id="start-time"
                          type="time"
                          value={selectedEvent.start_time ? selectedEvent.start_time.slice(0, 5) : ''}
                          onChange={(e) => handleFieldChange('start_time', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="end-time">End Time</Label>
                        <Input
                          id="end-time"
                          type="time"
                          value={selectedEvent.end_time ? selectedEvent.end_time.slice(0, 5) : ''}
                          onChange={(e) => handleFieldChange('end_time', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="theme">Event Theme</Label>
                        <Select
                          value={selectedEvent.theme_id?.toString() || ''}
                          onValueChange={async (value) => {
                            const themeId = parseInt(value);
                            // Set theme and reset type immediately
                            setSelectedEvent(prev => prev ? { ...prev, theme_id: themeId, type_id: undefined } : prev);
                            // Fetch event types for the new theme and update eventTypes immediately
                            try {
                              let query = supabase
                                .from('event_types')
                                .select('id, name, theme_id')
                                .order('name');
                              query = query.eq('theme_id', themeId);
                              const { data, error } = await query;
                              if (!error && data) {
                                setEventTypes(data);
                              } else {
                                setEventTypes([]);
                              }
                            } catch (err) {
                              setEventTypes([]);
                            }
                          }}
                        >
                          <SelectTrigger className="bg-background border-border z-50">
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border shadow-lg z-50">
                            {eventThemes.map((theme) => (
                              <SelectItem key={theme.id} value={theme.id.toString()}>
                                {theme.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="type">Event Type</Label>
                        <Select
                          value={selectedEvent.type_id?.toString() || ''}
                          onValueChange={(value) => handleFieldChange('type_id', parseInt(value))}
                          disabled={!selectedEvent.theme_id}
                        >
                          <SelectTrigger className="bg-background border-border z-50">
                            <SelectValue 
                              placeholder={
                                selectedEvent.theme_id 
                                  ? "Select event type" 
                                  : "Select theme first"
                              } 
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border shadow-lg z-50">
                            {eventTypes
                              .filter(type => type.theme_id === selectedEvent.theme_id)
                              .map((type) => (
                                <SelectItem key={type.id} value={type.id.toString()}>
                                  {type.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="venue">Venue</Label>
                        <Input
                          id="venue"
                          value={selectedEvent.venue || ''}
                          onChange={(e) => handleFieldChange('venue', e.target.value)}
                          placeholder="Enter venue name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={selectedEvent.location || ''}
                          onChange={(e) => handleFieldChange('location', e.target.value)}
                          placeholder="Enter event location"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="budget">Budget</Label>
                        <Input
                          id="budget"
                          type="number"
                          value={budgetInput}
                          onChange={(e) => setBudgetInput(e.target.value)}
                          onBlur={() => {
                            if (budgetInput) {
                              const formatted = parseFloat(budgetInput).toFixed(2);
                              setBudgetInput(formatted);
                              handleFieldChange('budget', parseFloat(formatted));
                            } else {
                              handleFieldChange('budget', undefined);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          placeholder="Enter budget"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={selectedEvent.description || ''}
                          onChange={(e) => handleFieldChange('description', e.target.value)}
                          placeholder="Enter event description"
                          rows={3}
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
                    <ResourceManager 
                      eventId={selectedEvent.id} 
                      eventLocation={selectedEvent.location} 
                      refreshKey={resourceRefreshKey}
                    />
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
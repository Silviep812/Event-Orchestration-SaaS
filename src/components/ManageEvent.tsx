import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Clock, Plus, Save, AlertCircle, History, Eye, Trash2, Calendar as CalendarIcon, Package, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import TimelineView from "@/components/timeline/TimelineView";
import ResourceManager from "@/components/ResourceManager";
import Analytics from "@/components/Analytics";
import { TaskManager } from "@/components/TaskManager";

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
  status?: 'pending' | 'in_progress' | 'confirmed' | 'completed' | 'cancelled';
  budget?: number;
  expected_attendees?: number | null;
  created_at?: string;
  updated_at?: string;
  venue?: string;
  entertainment_id?: string | null;
  serv_vendor_rental_id?: string | null;
  archived?: boolean;
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
  parent_id?: number | null;
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

/** Postgres `time` rejects ''; optional columns must be split if migration not applied. */
function coerceTimeForDb(value: string | undefined | null): string | null {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  if (!s) return null;
  if (s.includes("T")) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toTimeString().slice(0, 8);
  }
  return s.length > 8 ? s.slice(0, 8) : s;
}

function supabaseErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: string }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return fallback;
}

/** Event is considered "past" when its end date (or start date if no end) is before today (local). */
function isPastEvent(event: { start_date?: string | null; end_date?: string | null }): boolean {
  const raw = event.end_date || event.start_date;
  if (!raw) return false;
  const d = new Date(String(raw).split("T")[0] + "T12:00:00");
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [showPastEvents, setShowPastEvents] = useState(false);
  /** When true, include archived events in the sidebar list (default: only active events). */
  const [showArchivedEvents, setShowArchivedEvents] = useState(false);
  const [entertainmentOptions, setEntertainmentOptions] = useState<{ id: string; business_name: string }[]>([]);
  const [rentalOptions, setRentalOptions] = useState<{ id: string; business_name: string }[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

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
      const transformedData = (data || [])
        .filter((event) => {
          const ev = event as ManageEventData;
          if (ev.archived && !showArchivedEvents) return false;
          if (!showPastEvents && isPastEvent(ev)) return false;
          return true;
        })
        .map((event) => ({
          ...event,
          theme_id: event.theme_id ? Number(event.theme_id) : undefined,
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

  useEffect(() => {
    (async () => {
      const { data: ent } = await supabase
        .from("entertainments")
        .select("id, business_name")
        .order("business_name");
      const { data: ren } = await supabase
        .from("serv_vendor_rentals")
        .select("id, business_name")
        .order("business_name");
      setEntertainmentOptions(ent || []);
      setRentalOptions(ren || []);
    })();
  }, []);

  const fetchEventTypes = async (themeId?: number) => {
    try {
      let query = supabase
        .from('event_types')
        .select('id, name, theme_id, parent_id')
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

      const entId = eventData.entertainment_id?.trim() || null;
      const rentalId = eventData.serv_vendor_rental_id?.trim() || null;

      const { error } = await supabase
        .from("events")
        .update({
          title: eventData.title,
          description: eventData.description,
          start_date: eventData.start_date,
          end_date: eventData.end_date,
          start_time: coerceTimeForDb(eventData.start_time),
          end_time: coerceTimeForDb(eventData.end_time),
          location: eventData.location,
          venue: eventData.venue,
          theme_id: eventData.theme_id,
          type_id: eventData.type_id,
          status: eventData.status,
          budget: eventData.budget,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventData.id);

      if (error) throw error;

      const { error: linkError } = await supabase
        .from("events")
        .update({
          entertainment_id: entId,
          serv_vendor_rental_id: rentalId,
        })
        .eq("id", eventData.id);

      if (linkError) {
        console.warn("Optional profile links not saved (run migration deliverable1_events_tasks):", linkError);
        if (isManual) {
          toast({
            title: "Event saved",
            description:
              "Core details saved; entertainment/rental links need migration 20260327120000_deliverable1_events_tasks on Supabase.",
            variant: "default",
          });
        }
      }

      // Sync details to resources after successful save
      await syncDetailsToResources(eventData);

      if (isManual) {
        if (!linkError) {
          toast({
            title: "Success",
            description: "Event saved successfully",
          });
        }

        for (const [field, change] of Object.entries(pendingChanges)) {
          const { error: logErr } = await supabase.rpc("log_change", {
            p_entity_type: "event",
            p_entity_id: eventData.id,
            p_action: "updated",
            p_field_name: field,
            p_old_value: change.oldValue?.toString() || null,
            p_new_value: change.newValue?.toString() || null,
            p_description: `Manual save: ${field} updated`,
          });
          if (logErr) console.error("log_change RPC:", logErr);
        }

        setPendingChanges({});
      }
      
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: supabaseErrorMessage(error, "Failed to save event"),
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
      const trialEnd = new Date('2026-04-30T23:59:59');
      const newDate = new Date(value);
      if (newDate > trialEnd) {
        toast({
          title: "Trial Limitation",
          description: "The trial version doesn't allow events with dates after April 30th, 2026.",
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

  /** Restore event + its tasks to active (not archived). SOW: `events.archived` column; restore is product complement to archive. */
  const restoreArchivedEvent = async () => {
    if (!selectedEvent?.id || !selectedEvent.archived) return;
    if (!window.confirm("Restore this event and its tasks? They will appear in the default list again.")) return;
    try {
      const { error: evErr } = await supabase
        .from("events")
        .update({ archived: false, updated_at: new Date().toISOString() })
        .eq("id", selectedEvent.id);
      if (evErr) throw evErr;
      const { error: taskErr } = await supabase
        .from("tasks")
        .update({ archived: false })
        .eq("event_id", selectedEvent.id);
      if (taskErr) throw taskErr;
      toast({
        title: "Event restored",
        description: `"${selectedEvent.title}" and its tasks are active again.`,
      });
      setSelectedEvent((prev) => (prev ? { ...prev, archived: false } : null));
      fetchEvents();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Could not restore event", variant: "destructive" });
    }
  };

  const submitNewRequest = async () => {
    if (!user || !selectedEvent?.id) {
      toast({
        title: "Select an event",
        description: "Choose an event before submitting a change request.",
        variant: "destructive",
      });
      return;
    }
    if (selectedEvent.archived) {
      toast({
        title: "Event is archived",
        description: "Restore the event before submitting a new request.",
        variant: "destructive",
      });
      return;
    }
    try {
      const { error: taskErr } = await supabase.from("tasks").insert({
        title: `[${newRequest.type.replace(/_/g, " ")}] ${newRequest.title}`,
        description: newRequest.description,
        event_id: selectedEvent.id,
        priority: newRequest.priority,
        status: "not_started",
        category: "Change Management",
        created_by: user.id,
      });
      if (taskErr) throw taskErr;

      await supabase.rpc("notify_coordinators", {
        p_title: `New ${newRequest.type.replace("_", " ")}: ${newRequest.title}`,
        p_message: newRequest.description,
        p_type: "new_request",
        p_entity_type: "event",
        p_entity_id: selectedEvent.id,
      });

      toast({
        title: "Request Submitted",
        description: "Posted to Project Management tasks and coordinators notified.",
      });

      setNewRequestDialog(false);
      setNewRequest({
        title: "",
        description: "",
        priority: "medium",
        type: "change_request",
      });
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Error",
        description: "Failed to submit request",
        variant: "destructive",
      });
    }
  };

  // Review & Confirm: set event status to 'confirmed', log to cm_activity, send Resend notification
  const reviewAndConfirm = async () => {
    if (!user || !selectedEvent?.id) {
      toast({
        title: "Select an event",
        description: "Choose an event before confirming.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      // 1. Update event status to 'confirmed'
      const { error: statusErr } = await supabase
        .from("events")
        .update({ status: "confirmed", updated_at: new Date().toISOString() })
        .eq("id", selectedEvent.id);
      if (statusErr) throw statusErr;

      // 2. Write cm_activity entry directly (trigger also fires, this is for explicit logging)
      const { error: actErr } = await supabase
        .from("cm_activity" as any)
        .insert({
          event_id: selectedEvent.id,
          entity_type: "event",
          entity_id: selectedEvent.id,
          action: "confirmed",
          changed_by: user.id,
          metadata: {
            title: selectedEvent.title,
            status: "confirmed",
            budget: selectedEvent.budget,
            expected_attendees: selectedEvent.expected_attendees,
          },
        });
      if (actErr) console.warn("cm_activity insert (run migration 20260327160000):", actErr);

      // 3. Mark open change-request tasks for this event as completed (PM sync)
      const { error: taskSyncErr } = await supabase
        .from("tasks")
        .update({ status: "completed" } as any)
        .eq("event_id", selectedEvent.id)
        .eq("category", "Change Management")
        .in("status", ["not_started", "in_progress"]);
      if (taskSyncErr) console.warn("task PM sync:", taskSyncErr);

      // 4. Notify via Resend (using existing notify_coordinators RPC)
      const { error: notifyErr } = await supabase.rpc("notify_coordinators", {
        p_title: `Event Confirmed: ${selectedEvent.title}`,
        p_message: `Event "${selectedEvent.title}" has been reviewed and confirmed by the planner.`,
        p_type: "event_confirmed",
        p_entity_type: "event",
        p_entity_id: selectedEvent.id,
      });
      if (notifyErr) console.warn("notify_coordinators:", notifyErr);

      // 5. Update local state
      setSelectedEvent(prev => prev ? { ...prev, status: "confirmed" } : prev);
      setEvents(prev =>
        prev.map(e => e.id === selectedEvent.id ? { ...e, status: "confirmed" } : e)
      );

      toast({
        title: "Event Confirmed",
        description: `"${selectedEvent.title}" status set to Confirmed. Notification sent.`,
      });
    } catch (error) {
      console.error("Error confirming event:", error);
      toast({
        title: "Error",
        description: supabaseErrorMessage(error, "Failed to confirm event"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
    if (user) fetchEvents();
  }, [user, showPastEvents, showArchivedEvents]);

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

  // Infer Event Category from type_id whenever event or types change
  useEffect(() => {
    if (!selectedEvent?.type_id || eventTypes.length === 0) return;
    const currentType = eventTypes.find(t => t.id === selectedEvent.type_id);
    if (!currentType) return;
    if (currentType.parent_id) {
      // It's a sub-type; category is its parent
      setSelectedCategoryId(currentType.parent_id);
    } else {
      // It's a top-level category itself
      setSelectedCategoryId(currentType.id);
    }
  }, [selectedEvent?.type_id, eventTypes]);

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
            Manage Event
          </h1>
          <p className="text-muted-foreground">
            Select an event in the list, then use tabs for details, timeline, resources, analytics, and change log. Use{" "}
            <span className="font-medium text-foreground">Show past</span> /{" "}
            <span className="font-medium text-foreground">Show archived</span> in the Events card to widen the list.{" "}
            <span className="font-medium text-foreground">New Request</span> needs an active (non-archived) event. Use{" "}
            <span className="font-medium text-foreground">Restore event</span> after turning on{" "}
            <span className="font-medium text-foreground">Show archived</span>.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:justify-end max-w-full min-w-0">
          <Button 
            onClick={() => navigate('/dashboard/create-event')}
            className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Resource
          </Button>
          {selectedEvent?.id && !selectedEvent.archived && (
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={async () => {
                if (!selectedEvent.id || !window.confirm("Archive this entire event and its tasks?")) return;
                try {
                  await supabase.from("events").update({ archived: true }).eq("id", selectedEvent.id);
                  await supabase.from("tasks").update({ archived: true }).eq("event_id", selectedEvent.id);
                  toast({ title: "Event archived", description: "Event and its tasks are archived." });
                  setSelectedEvent(null);
                  fetchEvents();
                } catch (e) {
                  toast({ title: "Error", description: "Could not archive event", variant: "destructive" });
                }
              }}
            >
              Archive event
            </Button>
          )}
          {selectedEvent?.id && selectedEvent.archived && (
            <Button type="button" variant="default" className="shrink-0" onClick={restoreArchivedEvent}>
              Restore event
            </Button>
          )}
          
          <div className="flex items-center gap-2 text-sm shrink-0">
            <input
              type="checkbox"
              id="autosave"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="autosave">Auto-save</label>
          </div>
          
          <Button
            type="button"
            className="bg-gradient-primary hover:opacity-90 transition-opacity shrink-0"
            disabled={!selectedEvent?.id || !!selectedEvent?.archived}
            title={
              !selectedEvent?.id
                ? "Select an event in the list first"
                : selectedEvent?.archived
                  ? "Restore the event first to submit a new request"
                  : undefined
            }
            onClick={() => setNewRequestDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
          <Dialog open={newRequestDialog} onOpenChange={setNewRequestDialog}>
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
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Events
              </CardTitle>
              <div className="flex flex-col items-end gap-1 gap-x-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-7 px-2"
                  onClick={() => setShowPastEvents((prev) => !prev)}
                >
                  {showPastEvents ? "Hide past" : "Show past"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-7 px-2"
                  onClick={() => setShowArchivedEvents((prev) => !prev)}
                >
                  {showArchivedEvents ? "Hide archived" : "Show archived"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {events.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No events match these filters. Try{" "}
                  <button
                    type="button"
                    className="text-primary underline underline-offset-2"
                    onClick={() => {
                      setShowPastEvents(true);
                      setShowArchivedEvents(true);
                    }}
                  >
                    show past and archived
                  </button>
                  , or create one with <span className="font-medium">New Resource</span>.
                </div>
              ) : (
                events.map((event, index) => (
                  <div
                    key={event.id || index}
                    className={`p-4 border-b border-border/30 cursor-pointer transition-all hover:bg-surface/50 ${
                      selectedEvent?.id === event.id ? "bg-primary/10 border-l-4 border-l-primary" : ""
                    }`}
                    onClick={async () => {
                      setSelectedEvent(event);
                      setSelectedCategoryId(null);
                      if (event.type_id && event.theme_id) {
                        await fetchEventTypes(event.theme_id);
                      }
                    }}
                  >
                    <div className="font-medium text-sm truncate">{event.title || "Unnamed Event"}</div>
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-xs text-muted-foreground">{getStatusDisplay(event.status)}</span>
                      {event.archived && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          Archived
                        </Badge>
                      )}
                    </div>
                    {event.start_date && (
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(event.start_date + "T00:00:00"), "MMM dd, yyyy")}
                      </div>
                    )}
                  </div>
                ))
              )}
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
                      <div className="flex items-center gap-2 flex-wrap">
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
                        {selectedEvent?.status !== "confirmed" && (
                          <Button
                            onClick={reviewAndConfirm}
                            size="sm"
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Review & Confirm
                          </Button>
                        )}
                        {selectedEvent?.status === "confirmed" && (
                          <span className="text-xs font-medium text-green-600 border border-green-300 rounded px-2 py-1">
                            Confirmed
                          </span>
                        )}
                        {!selectedEvent.archived ? (
                          <Button
                            onClick={async () => {
                              if (!selectedEvent?.id) return;
                              if (!window.confirm("Archive this event? It will be hidden from the default list.")) return;
                              const { error } = await supabase
                                .from("events")
                                .update({ archived: true, updated_at: new Date().toISOString() } as any)
                                .eq("id", selectedEvent.id);
                              if (error) {
                                toast({ title: "Error", description: "Failed to archive event", variant: "destructive" });
                              } else {
                                await supabase.from("tasks").update({ archived: true }).eq("event_id", selectedEvent.id);
                                toast({ title: "Archived", description: `"${selectedEvent.title}" has been archived.` });
                                setSelectedEvent(null);
                                fetchEvents();
                              }
                            }}
                            size="sm"
                            variant="outline"
                            disabled={saving}
                            className="text-muted-foreground border-muted"
                          >
                            Archive Event
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            onClick={restoreArchivedEvent}
                            size="sm"
                            disabled={saving}
                          >
                            Restore Event
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
                            <SelectItem value="confirmed">Confirmed</SelectItem>
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
                            setSelectedEvent(prev => prev ? { ...prev, theme_id: themeId, type_id: undefined } : prev);
                            setSelectedCategoryId(null);
                            try {
                              const { data, error } = await supabase
                                .from('event_types')
                                .select('id, name, theme_id, parent_id')
                                .eq('theme_id', themeId)
                                .order('name');
                              if (!error && data) {
                                setEventTypes(data);
                              } else {
                                setEventTypes([]);
                              }
                            } catch (err) {
                              setEventTypes([]);
                            }
                            handleFieldChange('theme_id', themeId);
                          }}
                        >
                          <SelectTrigger className="bg-background border-border z-50">
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border shadow-lg z-50">
                            {eventThemes.map((theme) => (
                              <SelectItem key={theme.id} value={theme.id.toString()}>
                                {theme.name}
                                {theme.premium ? " (Premium)" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="eventCategory">Event Category</Label>
                        <Select
                          value={selectedCategoryId?.toString() || ''}
                          onValueChange={(value) => {
                            const catId = parseInt(value);
                            setSelectedCategoryId(catId);
                            // If current type_id is not a child of this category, reset it
                            const currentType = eventTypes.find(t => t.id === selectedEvent?.type_id);
                            if (!currentType || currentType.parent_id !== catId) {
                              // The category itself is the type when no sub-types; pick the category as type_id
                              setSelectedEvent(prev => prev ? { ...prev, type_id: undefined } : prev);
                            }
                          }}
                          disabled={!selectedEvent.theme_id}
                        >
                          <SelectTrigger className="bg-background border-border z-50" id="eventCategory">
                            <SelectValue
                              placeholder={selectedEvent.theme_id ? "Select event category" : "Select theme first"}
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border shadow-lg z-50">
                            {eventTypes
                              .filter(t => !t.parent_id)
                              .map((cat) => (
                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="eventType">Event Type</Label>
                        <Select
                          value={selectedEvent.type_id?.toString() || ''}
                          onValueChange={(value) => handleFieldChange('type_id', parseInt(value))}
                          disabled={!selectedCategoryId}
                        >
                          <SelectTrigger className="bg-background border-border z-50" id="eventType">
                            <SelectValue
                              placeholder={selectedCategoryId ? "Select event type" : "Select category first"}
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border shadow-lg z-50">
                            {(() => {
                              const children = eventTypes.filter(t => t.parent_id === selectedCategoryId);
                              if (children.length === 0 && selectedCategoryId) {
                                // Category has no sub-types: allow selecting the category itself as the type
                                const cat = eventTypes.find(t => t.id === selectedCategoryId);
                                return cat ? (
                                  <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                                ) : null;
                              }
                              return children.map((type) => (
                                <SelectItem key={type.id} value={type.id.toString()}>
                                  {type.name}
                                </SelectItem>
                              ));
                            })()}
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
                        <Label htmlFor="entertainment_id">Entertainment Profile</Label>
                        <Select
                          value={selectedEvent.entertainment_id || "__none__"}
                          onValueChange={(v) =>
                            handleFieldChange("entertainment_id", v === "__none__" ? null : v)
                          }
                        >
                          <SelectTrigger id="entertainment_id">
                            <SelectValue placeholder="Optional" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">None</SelectItem>
                            {entertainmentOptions.map((o) => (
                              <SelectItem key={o.id} value={o.id}>
                                {o.business_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="serv_vendor_rental_id">External Vendor Profile</Label>
                        <Select
                          value={selectedEvent.serv_vendor_rental_id || "__none__"}
                          onValueChange={(v) =>
                            handleFieldChange("serv_vendor_rental_id", v === "__none__" ? null : v)
                          }
                        >
                          <SelectTrigger id="serv_vendor_rental_id">
                            <SelectValue placeholder="Optional" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">None</SelectItem>
                            {rentalOptions.map((o) => (
                              <SelectItem key={o.id} value={o.id}>
                                {o.business_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                    <CardTitle>Timeline and task assignment</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <TimelineView eventId={selectedEvent.id} />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/dashboard/project-management?eventId=${selectedEvent.id}&openModal=true`
                          )
                        }
                      >
                        Add task assignment (opens PM Add Task)
                      </Button>
                    </div>
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">Tasks for this event</h3>
                      <TaskManager eventId={selectedEvent.id} />
                    </div>
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
                  eventId={selectedEvent.id}
                  onInteractionTrack={(interaction) => {
                    console.log("User interaction tracked:", interaction);
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
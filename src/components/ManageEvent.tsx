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
import { usePermissions } from "@/lib/permissions";
import { Bell, Clock, Plus, Save, AlertCircle, History, Eye, Trash2, Calendar as CalendarIcon, Package, BarChart3, MapPin, DollarSign, Tag, Sparkles, CheckCircle2, XCircle, Loader2, TrendingUp, RefreshCw, Edit, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import TimelineView from "@/components/timeline/TimelineView";
import ResourceManager from "@/components/ResourceManager";
import Analytics from "@/components/Analytics";
import { TeamMemberTaskAssignments } from "@/components/TeamMemberTaskAssignments";

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


const ManageEvent = () => {
  const [events, setEvents] = useState<ManageEventData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ManageEventData | null>(null);
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{ [key: string]: { oldValue: any, newValue: any } }>({});
  const [eventThemes, setEventThemes] = useState<EventTheme[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [statusFilters, setStatusFilters] = useState<('pending' | 'in_progress' | 'completed' | 'cancelled' | 'all')[]>(['pending', 'in_progress']);
  const [hasEventsInDb, setHasEventsInDb] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin, isCoordinator, isViewer, hasMinPermission } = usePermissions();

  const [budgetInput, setBudgetInput] = useState<string>('');
  const [venueBookingCompleted, setVenueBookingCompleted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

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
      // First, check if user has any events at all (for showing/hiding filters)
      const { count: totalCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setHasEventsInDb((totalCount || 0) > 0);

      // Build query with database-level filtering
      let query = supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id);

      // Filter by status at database level
      if (!statusFilters.includes('all')) {
        // Filter by selected statuses - cast to the expected type
        const statusValues = statusFilters.filter(s => s !== 'all') as ("cancelled" | "completed" | "in_progress" | "pending")[];
        if (statusValues.length > 0) {
          // Build filter conditions: include null status if 'pending' is selected
          const hasPending = statusValues.includes('pending');
          const otherStatuses = statusValues.filter(s => s !== 'pending');

          if (hasPending && otherStatuses.length > 0) {
            // Include pending, null, and other statuses
            query = query.or(`status.in.(${statusValues.join(',')}),status.is.null`);
          } else if (hasPending) {
            // Only pending: include null status
            query = query.or('status.eq.pending,status.is.null');
          } else {
            // Other statuses only
            query = query.in('status', otherStatuses);
          }
        }
      }

      // Order by created_at descending (status ordering will be done in frontend)
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      let transformedData = data.map(event => ({
        ...event,
        theme_id: event.theme_id ? Number(event.theme_id) : undefined
      }));

      // If there's a selected event and it's not in the filtered results, fetch it separately
      if (selectedEvent?.id) {
        const selectedEventInResults = transformedData.some(e => e.id === selectedEvent.id);
        if (!selectedEventInResults) {
          try {
            const { data: selectedEventData, error: selectedError } = await supabase
              .from('events')
              .select('*')
              .eq('id', selectedEvent.id)
              .eq('user_id', user.id)
              .single();

            if (!selectedError && selectedEventData) {
              const transformedSelectedEvent = {
                ...selectedEventData,
                theme_id: selectedEventData.theme_id ? Number(selectedEventData.theme_id) : undefined
              };
              // Add selected event at the beginning
              transformedData = [transformedSelectedEvent, ...transformedData];
            }
          } catch (err) {
            console.error('Error fetching selected event:', err);
          }
        }
      }

      // Sort by status order, then by created_at within each status
      const statusOrder = ['pending', 'in_progress', 'completed', 'cancelled'];
      transformedData.sort((a, b) => {
        const aStatus = a.status || 'pending';
        const bStatus = b.status || 'pending';
        const aIndex = statusOrder.indexOf(aStatus);
        const bIndex = statusOrder.indexOf(bStatus);

        if (aIndex !== bIndex) {
          return aIndex - bIndex;
        }

        // Within same status, sort by created_at descending
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bDate - aDate;
      });

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

  // Events are already filtered and sorted from fetchEvents
  // The selected event is already included in the events array if it exists
  const filteredEvents = events;

  const handleStatusFilterToggle = (status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'all') => {
    if (status === 'all') {
      setStatusFilters(['all']);
    } else {
      setStatusFilters(prev => {
        const newFilters = prev.includes('all') ? [] : [...prev];
        if (newFilters.includes(status)) {
          // Remove if already selected
          const filtered = newFilters.filter(s => s !== status);
          // If no filters left, default to pending and in_progress
          return filtered.length > 0 ? filtered : ['pending', 'in_progress'];
        } else {
          // Add to filters
          return [...newFilters, status];
        }
      });
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
      // Fetch event change logs
      const { data: eventLogs, error: eventError } = await supabase
        .from('cm_change_logs')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', 'event')
        .order('created_at', { ascending: false });

      if (eventError) throw eventError;

      // Also fetch change requests related to this event to show their status
      const { data: changeRequests, error: crError } = await supabase
        .from('change_requests')
        .select('id, title, status, created_at, requested_by, approved_by, applied_by, field_changes')
        .eq('event_id', entityId)
        .order('created_at', { ascending: false });

      if (crError) {
        console.error('Error fetching change requests:', crError);
      }

      // Fetch user names for approvers/appliers
      const userIds = new Set<string>();
      if (changeRequests) {
        changeRequests.forEach((cr: any) => {
          if (cr.requested_by) userIds.add(cr.requested_by);
          if (cr.approved_by) userIds.add(cr.approved_by);
          if (cr.applied_by) userIds.add(cr.applied_by);
        });
      }
      eventLogs?.forEach(log => {
        if (log.changed_by) userIds.add(log.changed_by);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', Array.from(userIds));

      const userNames: Record<string, string> = {};
      profiles?.forEach(profile => {
        userNames[profile.user_id] = profile.display_name || 'Unknown User';
      });

      // Combine and format logs
      const allLogs: ChangeLog[] = [];

      // Add event logs (these include approval/rejection/application logs)
      if (eventLogs) {
        allLogs.push(...eventLogs);
      }

      // Add change request creation logs (only if not already logged in change_logs)
      if (changeRequests) {
        for (const cr of changeRequests as any[]) {
          const fieldChanges = cr.field_changes as Record<string, { oldValue: any; newValue: any }> | null;
          if (fieldChanges) {
            // Check if this change request's creation is already logged
            const alreadyLogged = eventLogs?.some(log =>
              log.change_description?.includes(cr.title) ||
              (log.field_name && Object.keys(fieldChanges).includes(log.field_name) &&
                log.change_description?.includes('Change requested'))
            );

            if (!alreadyLogged) {
              // Create log entries for change request creation
              for (const [field, change] of Object.entries(fieldChanges)) {
                const fieldLabel = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                allLogs.push({
                  id: `${cr.id}-${field}-request`,
                  entity_type: 'event',
                  entity_id: entityId,
                  action: 'updated',
                  field_name: field,
                  old_value: change.oldValue?.toString() || null,
                  new_value: change.newValue?.toString() || null,
                  change_description: `Change requested: ${fieldLabel} from "${change.oldValue || 'empty'}" to "${change.newValue || 'empty'}" by ${userNames[cr.requested_by] || 'Unknown User'}`,
                  changed_by: cr.requested_by || '',
                  created_at: cr.created_at
                } as ChangeLog);
              }
            }
          }
        }
      }

      // Sort by created_at descending
      allLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setChangeLogs(allLogs);
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

  const handleFieldChange = (field: string, value: any) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7ba7f6db-4491-4548-a2a1-1710bced117d', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'ManageEvent.tsx:563', message: 'handleFieldChange entry', data: { field, value, hasSelectedEvent: !!selectedEvent }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
    // #endregion
    if (!selectedEvent) return;

    // Trial version date restriction
    if ((field === 'start_date' || field === 'end_date') && value) {
      const trialEnd = new Date('2026-06-30T23:59:59');
      const newDate = new Date(value);
      if (newDate > trialEnd) {
        toast({
          title: "Trial Limitation",
          description: "The trial version doesn't allow events with dates after June 30th, 2026.",
          variant: "destructive",
        });
        return;
      }
    }

    // Capture old value from original event data (not from pending changes)
    const originalEvent = events.find(e => e.id === selectedEvent.id);
    const oldValue = originalEvent?.[field as keyof ManageEventData] ?? selectedEvent[field as keyof ManageEventData];
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7ba7f6db-4491-4548-a2a1-1710bced117d', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'ManageEvent.tsx:582', message: 'Value comparison', data: { field, oldValue, newValue: value, areEqual: oldValue === value, oldValueType: typeof oldValue, newValueType: typeof value }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
    // #endregion

    // Only proceed if value actually changed from original
    if (oldValue === value) {
      // If value matches original, remove from pending changes
      setPendingChanges(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7ba7f6db-4491-4548-a2a1-1710bced117d', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'ManageEvent.tsx:592', message: 'Value unchanged, removing from pending', data: { field }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
      // #endregion
      return;
    }

    // Update local state for preview (but don't save)
    const updatedEvent = { ...selectedEvent, [field]: value };
    setSelectedEvent(updatedEvent);

    // Track pending change
    setPendingChanges(prev => {
      const updated = {
        ...prev,
        [field]: {
          oldValue: oldValue,
          newValue: value
        }
      };
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7ba7f6db-4491-4548-a2a1-1710bced117d', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'ManageEvent.tsx:606', message: 'Adding to pendingChanges', data: { field, oldValue, newValue: value, pendingFields: Object.keys(updated) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
      // #endregion
      return updated;
    });
  };

  const submitChangeRequest = async () => {
    if (!selectedEvent?.id || !user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in and have an event selected",
        variant: "destructive",
      });
      return;
    }

    if (Object.keys(pendingChanges).length === 0) {
      toast({
        title: "No Changes",
        description: "Please make some changes before requesting approval",
        variant: "destructive",
      });
      return;
    }

    // Check if trying to change locked date fields
    if (venueBookingCompleted && (pendingChanges.start_date || pendingChanges.end_date)) {
      toast({
        title: "Cannot Change Dates",
        description: "Event dates are locked because venue booking is completed. Delete and recreate the event to change dates.",
        variant: "destructive",
      });
      return;
    }

    // Check permissions
    if (!hasMinPermission('coordinator')) {
      toast({
        title: "Access Denied",
        description: "Only coordinators and admins can request changes",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      // Create a description listing all field changes
      const changeDescriptions = Object.entries(pendingChanges).map(([field, change]) => {
        const fieldLabel = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `${fieldLabel}: "${change.oldValue || 'empty'}" → "${change.newValue || 'empty'}"`;
      });

      const title = `Event Update: ${Object.keys(pendingChanges).length} field${Object.keys(pendingChanges).length > 1 ? 's' : ''} changed`;
      const description = `Requested changes:\n${changeDescriptions.join('\n')}`;

      // Convert pendingChanges to JSONB format for structured storage
      const fieldChangesJsonb: Record<string, { oldValue: any; newValue: any }> = {};
      for (const [field, change] of Object.entries(pendingChanges)) {
        fieldChangesJsonb[field] = {
          oldValue: change.oldValue ?? null,
          newValue: change.newValue ?? null
        };
      }

      // Create change request in the database with field_changes JSONB
      // Build base insert data with required fields
      const baseInsertData: any = {
        title: title,
        priority: 'medium',
        status: 'pending',
        event_id: selectedEvent.id,
        requested_by: user.id,
        field_changes: fieldChangesJsonb as any
      };

      // Helper function to check if error is about a missing column
      const isColumnError = (error: any, columnName: string): boolean => {
        return error.message?.includes(columnName) ||
          error.code === '42703' ||
          (error.message?.includes('column') && error.message?.includes(columnName));
      };

      // Try to insert with all optional columns, retry without them if they don't exist
      let createdTask: any;
      let insertData = { ...baseInsertData };

      // Add optional columns
      insertData.description = description;
      insertData.change_type = 'event_update';

      try {
        const { data, error } = await supabase
          .from('change_requests')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          // Check if error is about missing columns
          const isDescriptionError = isColumnError(error, 'description');
          const isChangeTypeError = isColumnError(error, 'change_type');

          if (isDescriptionError || isChangeTypeError) {
            // Retry without the problematic columns
            const retryData = { ...baseInsertData };
            if (!isDescriptionError) retryData.description = description;
            if (!isChangeTypeError) retryData.change_type = 'event_update';

            const { data: retryDataResult, error: retryError } = await supabase
              .from('change_requests')
              .insert(retryData)
              .select()
              .single();

            if (retryError) {
              // If still failing, try with only required fields
              const { data: minimalData, error: minimalError } = await supabase
                .from('change_requests')
                .insert(baseInsertData)
                .select()
                .single();

              if (minimalError) throw minimalError;
              createdTask = minimalData;
            } else {
              createdTask = retryDataResult;
            }
          } else {
            throw error;
          }
        } else {
          createdTask = data;
        }
      } catch (err: any) {
        // If it's a column error, try with minimal fields
        const isDescriptionError = isColumnError(err, 'description');
        const isChangeTypeError = isColumnError(err, 'change_type');

        if (isDescriptionError || isChangeTypeError) {
          const minimalData = { ...baseInsertData };
          if (!isDescriptionError && description) minimalData.description = description;
          if (!isChangeTypeError) minimalData.change_type = 'event_update';

          const { data, error } = await supabase
            .from('change_requests')
            .insert(minimalData)
            .select()
            .single();

          if (error) {
            // Last resort: only required fields
            const { data: finalData, error: finalError } = await supabase
              .from('change_requests')
              .insert(baseInsertData)
              .select()
              .single();

            if (finalError) throw finalError;
            createdTask = finalData;
          } else {
            createdTask = data;
          }
        } else {
          throw err;
        }
      }

      if (!createdTask) {
        throw new Error('Failed to create change request');
      }

      // Log each field change individually for the change request
      for (const [field, change] of Object.entries(pendingChanges)) {
        try {
          const fieldLabel = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          await supabase.rpc('log_change', {
            p_entity_type: 'change_request',
            p_entity_id: createdTask.id,
            p_action: 'created',
            p_field_name: field,
            p_old_value: change.oldValue?.toString() || null,
            p_new_value: change.newValue?.toString() || null,
            p_description: `Change requested: ${fieldLabel} from "${change.oldValue || 'empty'}" to "${change.newValue || 'empty'}" (pending approval)`
          });
        } catch (logError) {
          console.error('Error logging field change:', logError);
        }
      }

      // Refresh change logs to show the new entries
      if (selectedEvent.id) {
        await fetchChangeLogs(selectedEvent.id);
      }

      toast({
        title: "Change Request Submitted",
        description: `Your request to change ${Object.keys(pendingChanges).length} field${Object.keys(pendingChanges).length > 1 ? 's' : ''} has been submitted for approval`,
      });

      // Clear pending changes and reset to original values
      const originalEvent = events.find(e => e.id === selectedEvent.id);
      if (originalEvent) {
        setSelectedEvent(originalEvent);
      }
      setPendingChanges({});
      setIsEditMode(false); // Switch back to read-only mode

      // Refresh events to ensure we have latest data
      await fetchEvents();
    } catch (error: any) {
      console.error('Error submitting change request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit change request",
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

  // Helper to get status badge variant
  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{getStatusDisplay(status)}</Badge>;
    }
  };

  // Calculate event stats
  const getEventStats = () => {
    if (!selectedEvent) return null;
    return {
      hasDates: !!(selectedEvent.start_date && selectedEvent.end_date),
      hasLocation: !!selectedEvent.location,
      hasVenue: !!selectedEvent.venue,
      hasBudget: !!selectedEvent.budget,
      hasDescription: !!selectedEvent.description,
    };
  };

  // Real-time subscriptions
  useEffect(() => {
    const eventsChannel = supabase
      .channel('manage-events-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events'
      }, async (payload) => {
        console.log('Event change detected:', payload);
        await fetchEvents();
        // Trigger resource refresh when event is updated
        if (payload.eventType === 'UPDATE' && selectedEvent?.id === payload.new?.id) {
          setResourceRefreshKey(prev => prev + 1);
          // Update selectedEvent with latest data
          const { data: updatedEvent } = await supabase
            .from('events')
            .select('*')
            .eq('id', selectedEvent.id)
            .single();

          if (updatedEvent) {
            const transformedEvent = {
              ...updatedEvent,
              theme_id: updatedEvent.theme_id ? Number(updatedEvent.theme_id) : undefined
            };
            setSelectedEvent(transformedEvent);
          }
        }
      })
      .subscribe();

    if (!selectedEvent?.id) {
      return () => {
        supabase.removeChannel(eventsChannel);
      };
    }

    const changeLogsChannel = supabase
      .channel(`change-logs-updates-${selectedEvent.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'change_logs'
      }, (payload: any) => {
        // Check if this log is for our event
        const entityId = payload.new?.entity_id || payload.old?.entity_id;
        const entityType = payload.new?.entity_type || payload.old?.entity_type;

        if (entityId === selectedEvent.id && entityType === 'event') {
          console.log('Change log update detected for event:', selectedEvent.id, payload);
          fetchChangeLogs(selectedEvent.id);
        }
      })
      .subscribe();

    const changeRequestsChannel = supabase
      .channel(`change-requests-updates-${selectedEvent.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'change_requests'
      }, async (payload: any) => {
        // Check if this change request is for our event
        const eventId = payload.new?.event_id || payload.old?.event_id;
        const selectedEventId = selectedEvent.id;
        const newStatus = payload.new?.status;

        // Compare as strings to handle both UUID and TEXT event IDs
        if (eventId && selectedEventId && String(eventId) === String(selectedEventId)) {
          console.log('Change request update detected for event:', selectedEvent.id, payload);
          fetchChangeLogs(selectedEvent.id);

          // If change request was applied, refresh the event details
          if (newStatus === 'applied' && payload.eventType === 'UPDATE') {
            console.log('Change request applied, refreshing event details...');
            // Refresh events list
            await fetchEvents();
            // Update selectedEvent with latest data if it's a UUID
            if (selectedEvent.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedEvent.id)) {
              const { data: updatedEvent } = await supabase
                .from('events')
                .select('*')
                .eq('id', selectedEvent.id)
                .single();

              if (updatedEvent) {
                const transformedEvent = {
                  ...updatedEvent,
                  theme_id: updatedEvent.theme_id ? Number(updatedEvent.theme_id) : undefined
                };
                setSelectedEvent(transformedEvent);
                // Also update in events array
                setEvents(prev => prev.map(e => e.id === selectedEvent.id ? transformedEvent : e));
              }
            }
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(changeLogsChannel);
      supabase.removeChannel(changeRequestsChannel);
    };
  }, [selectedEvent?.id]);

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchThemes();
      fetchEventTypes();
    }
  }, [user, statusFilters, selectedEvent?.theme_id]);

  useEffect(() => {
    if (selectedEvent?.id) {
      fetchChangeLogs(selectedEvent.id);
      checkVenueBooking(selectedEvent.id);
    }
  }, [selectedEvent?.id]);

  // Check if venue booking is completed for this event
  const checkVenueBooking = async (eventId: string) => {
    try {
      // Check if event_id is UUID or TEXT
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);

      if (isUUID) {
        // For UUID events, check reservation_submissions
        const { data: reservations } = await supabase
          .from('reservation_submissions')
          .select('*')
          .eq('event_id', eventId)
          .limit(1);

        // If there's a reservation, consider booking as potentially completed
        // You may need to add a status/confirmation field to reservation_submissions
        setVenueBookingCompleted(!!reservations && reservations.length > 0);
      } else {
        // For TEXT event IDs (Create Event table), check reservation_submissions with event_id
        const { data: reservations } = await supabase
          .from('reservation_submissions')
          .select('*')
          .eq('event_id', eventId)
          .limit(1);

        setVenueBookingCompleted(!!reservations && reservations.length > 0);
      }
    } catch (error) {
      console.error('Error checking venue booking:', error);
      setVenueBookingCompleted(false);
    }
  };

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

  const eventStats = getEventStats();

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6 bg-gradient-to-br from-background via-background to-muted/20 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              Manage Events
            </h1>
          </div>
          <p className="text-muted-foreground ml-14">
            Real-time event management with comprehensive change tracking
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            onClick={() => window.location.href = '/dashboard/create-event'}
            className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events List */}
        <div className="lg:col-span-1 space-y-6">
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/50 to-transparent">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              Events
              <Badge variant="secondary" className="ml-auto text-xs">
                {filteredEvents.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Loading State */}
            {loading && (
              <div className="p-8 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Loading events...</p>
              </div>
            )}

            {/* Status Filter Pills - Only show when not loading and there are events in database */}
            {!loading && hasEventsInDb && (
              <div className="p-4 border-b border-border/30 bg-muted/20">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={statusFilters.includes('all') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusFilterToggle('all')}
                    className="h-7 text-xs"
                  >
                    All
                  </Button>
                  <Button
                    variant={statusFilters.includes('pending') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusFilterToggle('pending')}
                    className="h-7 text-xs"
                  >
                    Pending
                  </Button>
                  <Button
                    variant={statusFilters.includes('in_progress') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusFilterToggle('in_progress')}
                    className="h-7 text-xs"
                  >
                    In Progress
                  </Button>
                  <Button
                    variant={statusFilters.includes('completed') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusFilterToggle('completed')}
                    className="h-7 text-xs"
                  >
                    Completed
                  </Button>
                  <Button
                    variant={statusFilters.includes('cancelled') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusFilterToggle('cancelled')}
                    className="h-7 text-xs"
                  >
                    Cancelled
                  </Button>
                </div>
              </div>
            )}

            {/* Events List or Empty State */}
            {!loading && filteredEvents.length === 0 ? (
              <div className="p-8 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mb-4">
                  {events.length === 0 ? 'No events found' : 'No events match the selected filters'}
                </p>
                {events.length === 0 && (
                  <Button
                    onClick={() => window.location.href = '/dashboard/create-event'}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    Create Event
                  </Button>
                )}
              </div>
            ) : !loading && (
              <div className="max-h-[600px] overflow-y-auto">
                {filteredEvents.map((event, index) => (
                  <div
                    key={event.id || index}
                    className={`p-4 border-b border-border/30 cursor-pointer transition-all duration-200 group ${selectedEvent?.id === event.id
                      ? 'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-l-4 border-l-primary shadow-sm'
                      : 'hover:bg-muted/30 hover:border-l-2 hover:border-l-primary/30'
                      }`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-semibold text-sm truncate flex-1 group-hover:text-primary transition-colors">
                        {event.title || 'Unnamed Event'}
                      </div>
                      {selectedEvent?.id === event.id && (
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(event.status)}
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      {event.start_date && (
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="h-3 w-3" />
                          {format(new Date(event.start_date + 'T00:00:00'), 'MMM dd, yyyy')}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      {event.budget && (
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3 w-3" />
                          ${Number(event.budget).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <TeamMemberTaskAssignments />
        </div>

        {/* Event Details & Change Logs */}
        <div className="lg:col-span-2 space-y-6">
          {selectedEvent ? (
            <>
              {/* Quick Stats Cards */}
              {eventStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <div className="text-xs font-medium text-blue-900 dark:text-blue-100">Dates</div>
                    </div>
                    <div className="mt-1 text-lg font-semibold text-blue-700 dark:text-blue-300">
                      {eventStats.hasDates ? '✓ Set' : '—'}
                    </div>
                  </Card>
                  <Card className="p-3 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <div className="text-xs font-medium text-green-900 dark:text-green-100">Location</div>
                    </div>
                    <div className="mt-1 text-lg font-semibold text-green-700 dark:text-green-300">
                      {eventStats.hasLocation ? '✓ Set' : '—'}
                    </div>
                  </Card>
                  <Card className="p-3 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <div className="text-xs font-medium text-purple-900 dark:text-purple-100">Budget</div>
                    </div>
                    <div className="mt-1 text-lg font-semibold text-purple-700 dark:text-purple-300">
                      {eventStats.hasBudget ? '✓ Set' : '—'}
                    </div>
                  </Card>
                  <Card className="p-3 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      <div className="text-xs font-medium text-orange-900 dark:text-orange-100">Status</div>
                    </div>
                    <div className="mt-1">
                      {getStatusBadge(selectedEvent.status)}
                    </div>
                  </Card>
                </div>
              )}

              <Tabs defaultValue="details" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-1 h-auto">
                  <TabsTrigger
                    value="details"
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">Details</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="timeline"
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Timeline</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="resources"
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                  >
                    <Package className="h-4 w-4" />
                    <span className="hidden sm:inline">Resources</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="analytics"
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Analytics</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="changelog"
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                  >
                    <History className="h-4 w-4" />
                    <span className="hidden sm:inline">Log</span>
                    {changeLogs.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                        {changeLogs.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/50 to-transparent">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Eye className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">Event Details</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Manage your event information
                            </p>
                          </div>
                        </div>
                        {!isViewer() && (
                          <div className="flex items-center gap-2">
                            {!isEditMode && Object.keys(pendingChanges).length === 0 && (
                              <Button
                                onClick={() => setIsEditMode(true)}
                                size="sm"
                                variant="outline"
                                disabled={saving}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                            )}
                            {isEditMode && (
                              <>
                                <Button
                                  onClick={() => {
                                    const originalEvent = events.find(e => e.id === selectedEvent?.id);
                                    if (originalEvent) {
                                      setSelectedEvent(originalEvent);
                                    }
                                    setPendingChanges({});
                                    setIsEditMode(false);
                                    toast({
                                      title: "Edit Cancelled",
                                      description: "All changes have been discarded",
                                    });
                                  }}
                                  variant="outline"
                                  size="sm"
                                  disabled={saving}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => {
                                    setIsEditMode(false);
                                    toast({
                                      title: "Edit Mode Exited",
                                      description: "Fields are now read-only. Click 'Request Change' to submit your changes.",
                                    });
                                  }}
                                  size="sm"
                                  variant="default"
                                  disabled={saving}
                                >
                                  <Save className="h-4 w-4 mr-2" />
                                  Done Editing
                                </Button>
                              </>
                            )}
                            {!isEditMode && Object.keys(pendingChanges).length > 0 && (
                              <>
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  {Object.keys(pendingChanges).length} pending change{Object.keys(pendingChanges).length > 1 ? 's' : ''}
                                </Badge>
                                <Button
                                  onClick={() => {
                                    const originalEvent = events.find(e => e.id === selectedEvent?.id);
                                    if (originalEvent) {
                                      setSelectedEvent(originalEvent);
                                    }
                                    setPendingChanges({});
                                    toast({
                                      title: "Changes Discarded",
                                      description: "All pending changes have been discarded",
                                    });
                                  }}
                                  variant="outline"
                                  size="sm"
                                  disabled={saving}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Discard
                                </Button>
                                {hasMinPermission('coordinator') && (
                                  <Button
                                    onClick={submitChangeRequest}
                                    size="sm"
                                    disabled={saving || Object.keys(pendingChanges).length === 0}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                                  >
                                    <Bell className="h-4 w-4 mr-2" />
                                    Request Change
                                  </Button>
                                )}
                              </>
                            )}
                            {saving && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-1.5 rounded-md bg-muted/50">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                Submitting...
                              </div>
                            )}
                          </div>
                        )}
                        {isViewer() && (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            Read-only access
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6 p-6">
                      {isViewer() ? (
                        // Read-only view for viewers
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <div className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                                <Tag className="h-3.5 w-3.5" />
                                Event Title
                              </div>
                              <p className="text-base font-medium">{selectedEvent.title || '—'}</p>
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                                <TrendingUp className="h-3.5 w-3.5" />
                                Event Status
                              </div>
                              <div>{getStatusBadge(selectedEvent.status)}</div>
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                                <CalendarIcon className="h-3.5 w-3.5" />
                                Start Date
                              </div>
                              <p className="text-base">{selectedEvent.start_date ? format(new Date(selectedEvent.start_date), 'PPP') : '—'}</p>
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                                <CalendarIcon className="h-3.5 w-3.5" />
                                End Date
                              </div>
                              <p className="text-base">{selectedEvent.end_date ? format(new Date(selectedEvent.end_date), 'PPP') : '—'}</p>
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                Start Time
                              </div>
                              <p className="text-base">{selectedEvent.start_time ? selectedEvent.start_time.slice(0, 5) : '—'}</p>
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                End Time
                              </div>
                              <p className="text-base">{selectedEvent.end_time ? selectedEvent.end_time.slice(0, 5) : '—'}</p>
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                                <Sparkles className="h-3.5 w-3.5" />
                                Event Theme
                              </div>
                              <p className="text-base">
                                {selectedEvent.theme_id
                                  ? eventThemes.find(t => t.id === selectedEvent.theme_id)?.name || '—'
                                  : '—'}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                                <Tag className="h-3.5 w-3.5" />
                                Event Type
                              </div>
                              <p className="text-base">
                                {selectedEvent.type_id
                                  ? eventTypes.find(t => t.id === selectedEvent.type_id)?.name || '—'
                                  : '—'}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" />
                                Venue
                              </div>
                              <p className="text-base">{selectedEvent.venue || '—'}</p>
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" />
                                Location
                              </div>
                              <p className="text-base">{selectedEvent.location || '—'}</p>
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                                <DollarSign className="h-3.5 w-3.5" />
                                Budget
                              </div>
                              <p className="text-base">
                                {selectedEvent.budget
                                  ? `$${selectedEvent.budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : '—'}
                              </p>
                            </div>
                          </div>

                          {selectedEvent.description && (
                            <div className="space-y-2">
                              <div className="text-sm font-semibold text-muted-foreground">Description</div>
                              <p className="text-base whitespace-pre-wrap">{selectedEvent.description}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Editable form for coordinators and admins
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="title" className="text-sm font-semibold flex items-center gap-2">
                              <Tag className="h-3.5 w-3.5" />
                              Event Title
                              {pendingChanges.title && (
                                <Badge variant="outline" className="ml-auto text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                  Changed
                                </Badge>
                              )}
                            </Label>
                            {isEditMode ? (
                              <Input
                                id="title"
                                value={selectedEvent.title || ''}
                                onChange={(e) => handleFieldChange('title', e.target.value)}
                                placeholder="Enter event title"
                                disabled={saving}
                                className={`h-10 ${pendingChanges.title ? 'border-yellow-300 bg-yellow-50/50' : ''}`}
                              />
                            ) : (
                              <p className="text-base font-medium py-2">{selectedEvent.title || '—'}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="status" className="text-sm font-semibold flex items-center gap-2">
                              <TrendingUp className="h-3.5 w-3.5" />
                              Event Status
                            </Label>
                            {isEditMode ? (
                              <Select
                                value={selectedEvent.status || ''}
                                onValueChange={(value) => handleFieldChange('status', value)}
                                disabled={isViewer() || saving || !isEditMode}
                              >
                                <SelectTrigger className="h-10">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div>{getStatusBadge(selectedEvent.status)}</div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="start-date" className="text-sm font-semibold flex items-center gap-2">
                              <CalendarIcon className="h-3.5 w-3.5" />
                              Start Date
                            </Label>
                            {isEditMode ? (
                              <Input
                                id="start-date"
                                type="date"
                                value={selectedEvent.start_date || ''}
                                onChange={(e) => handleFieldChange('start_date', e.target.value)}
                                disabled={venueBookingCompleted || isViewer() || saving || !isEditMode}
                                className="h-10"
                              />
                            ) : (
                              <p className="text-base py-2">{selectedEvent.start_date ? format(new Date(selectedEvent.start_date), 'PPP') : '—'}</p>
                            )}
                            {venueBookingCompleted && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Event dates are locked because venue booking is completed
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="end-date" className="text-sm font-semibold flex items-center gap-2">
                              <CalendarIcon className="h-3.5 w-3.5" />
                              End Date
                            </Label>
                            {isEditMode ? (
                              <Input
                                id="end-date"
                                type="date"
                                value={selectedEvent.end_date || ''}
                                onChange={(e) => handleFieldChange('end_date', e.target.value)}
                                disabled={venueBookingCompleted || isViewer() || saving || !isEditMode}
                                className="h-10"
                              />
                            ) : (
                              <p className="text-base py-2">{selectedEvent.end_date ? format(new Date(selectedEvent.end_date), 'PPP') : '—'}</p>
                            )}
                            {venueBookingCompleted && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Event dates are locked because venue booking is completed
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="start-time" className="text-sm font-semibold flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5" />
                              Start Time
                            </Label>
                            {isEditMode ? (
                              <Input
                                id="start-time"
                                type="time"
                                value={selectedEvent.start_time ? selectedEvent.start_time.slice(0, 5) : ''}
                                onChange={(e) => handleFieldChange('start_time', e.target.value)}
                                disabled={isViewer() || saving || !isEditMode}
                                className="h-10"
                              />
                            ) : (
                              <p className="text-base py-2">{selectedEvent.start_time ? selectedEvent.start_time.slice(0, 5) : '—'}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="end-time" className="text-sm font-semibold flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5" />
                              End Time
                            </Label>
                            {isEditMode ? (
                              <Input
                                id="end-time"
                                type="time"
                                value={selectedEvent.end_time ? selectedEvent.end_time.slice(0, 5) : ''}
                                onChange={(e) => handleFieldChange('end_time', e.target.value)}
                                disabled={isViewer() || saving || !isEditMode}
                                className="h-10"
                              />
                            ) : (
                              <p className="text-base py-2">{selectedEvent.end_time ? selectedEvent.end_time.slice(0, 5) : '—'}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="theme" className="text-sm font-semibold flex items-center gap-2">
                              <Sparkles className="h-3.5 w-3.5" />
                              Event Theme
                            </Label>
                            {isEditMode ? (
                              <Select
                                value={selectedEvent.theme_id?.toString() || ''}
                                disabled={isViewer() || saving || !isEditMode}
                                onValueChange={async (value) => {
                                  // #region agent log
                                  fetch('http://127.0.0.1:7242/ingest/7ba7f6db-4491-4548-a2a1-1710bced117d', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'ManageEvent.tsx:1511', message: 'Theme change handler entry', data: { value, selectedEventThemeId: selectedEvent?.theme_id, hasPendingChanges: Object.keys(pendingChanges).length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
                                  // #endregion
                                  const themeId = parseInt(value);
                                  // Set theme and reset type immediately
                                  setSelectedEvent(prev => prev ? { ...prev, theme_id: themeId, type_id: undefined } : prev);
                                  // #region agent log
                                  fetch('http://127.0.0.1:7242/ingest/7ba7f6db-4491-4548-a2a1-1710bced117d', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'ManageEvent.tsx:1515', message: 'After setSelectedEvent', data: { themeId, selectedEventThemeId: selectedEvent?.theme_id }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
                                  // #endregion
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
                                  // #region agent log
                                  fetch('http://127.0.0.1:7242/ingest/7ba7f6db-4491-4548-a2a1-1710bced117d', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'ManageEvent.tsx:1531', message: 'Theme change handler exit', data: { themeId, shouldCallHandleFieldChange: true }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
                                  // #endregion
                                  // Call handleFieldChange to track the change
                                  handleFieldChange('theme_id', themeId);
                                }}
                              >
                                <SelectTrigger className="bg-background border-border z-50 h-10">
                                  <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border shadow-lg z-50">
                                  {eventThemes.map((theme) => (
                                    <SelectItem key={theme.id} value={theme.id.toString()}>
                                      {theme.name}
                                      {theme.premium && (
                                        <Badge variant="secondary" className="ml-2 text-xs">Premium</Badge>
                                      )}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <p className="text-base py-2">
                                {selectedEvent.theme_id
                                  ? eventThemes.find(t => t.id === selectedEvent.theme_id)?.name || '—'
                                  : '—'}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="type" className="text-sm font-semibold flex items-center gap-2">
                              <Tag className="h-3.5 w-3.5" />
                              Event Type
                            </Label>
                            {isEditMode ? (
                              <Select
                                value={selectedEvent.type_id?.toString() || ''}
                                onValueChange={(value) => handleFieldChange('type_id', parseInt(value))}
                                disabled={!selectedEvent.theme_id || isViewer() || saving || !isEditMode}
                              >
                                <SelectTrigger className="bg-background border-border z-50 h-10">
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
                            ) : (
                              <p className="text-base py-2">
                                {selectedEvent.type_id
                                  ? eventTypes.find(t => t.id === selectedEvent.type_id)?.name || '—'
                                  : '—'}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="venue" className="text-sm font-semibold flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5" />
                              Venue
                            </Label>
                            {isEditMode ? (
                              <Input
                                id="venue"
                                value={selectedEvent.venue || ''}
                                onChange={(e) => handleFieldChange('venue', e.target.value)}
                                placeholder="Enter venue name"
                                disabled={isViewer() || saving || !isEditMode}
                                className="h-10"
                              />
                            ) : (
                              <p className="text-base py-2">{selectedEvent.venue || '—'}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="location" className="text-sm font-semibold flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5" />
                              Location
                            </Label>
                            {isEditMode ? (
                              <Input
                                id="location"
                                value={selectedEvent.location || ''}
                                onChange={(e) => handleFieldChange('location', e.target.value)}
                                placeholder="Enter event location"
                                disabled={isViewer() || saving || !isEditMode}
                                className="h-10"
                              />
                            ) : (
                              <p className="text-base py-2">{selectedEvent.location || '—'}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="budget" className="text-sm font-semibold flex items-center gap-2">
                              <DollarSign className="h-3.5 w-3.5" />
                              Budget
                            </Label>
                            {isEditMode ? (
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                                  placeholder="0.00"
                                  disabled={isViewer() || saving || !isEditMode}
                                  className="h-10 pl-9"
                                />
                              </div>
                            ) : (
                              <p className="text-base py-2">
                                {selectedEvent.budget
                                  ? `$${selectedEvent.budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : '—'}
                              </p>
                            )}
                          </div>

                          <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                            {isEditMode ? (
                              <Textarea
                                id="description"
                                value={selectedEvent.description || ''}
                                onChange={(e) => handleFieldChange('description', e.target.value)}
                                placeholder="Enter event description"
                                disabled={saving || !isEditMode}
                                rows={4}
                                className="resize-none"
                              />
                            ) : (
                              <p className="text-base whitespace-pre-wrap py-2">{selectedEvent.description || '—'}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="timeline" className="space-y-4">
                  <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <TimelineView eventId={selectedEvent.id} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="resources" className="space-y-4">
                  <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
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

                <TabsContent value="changelog" className="space-y-4">
                  <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/50 to-transparent">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <History className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">Change History</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Track all changes made to this event
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (selectedEvent?.id) {
                              fetchChangeLogs(selectedEvent.id);
                            }
                          }}
                          className="gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Refresh
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="max-h-[600px] overflow-y-auto">
                        {changeLogs.length > 0 ? (
                          <div className="divide-y divide-border/30">
                            {changeLogs.map((log) => (
                              <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${log.action === 'created' ? 'bg-green-50 text-green-700 border-green-200' :
                                          log.action === 'approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            log.action === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                              log.action === 'applied' ? 'bg-green-50 text-green-700 border-green-200' :
                                                log.action === 'cancelled' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                  log.action === 'updated' ?
                                                    (log.change_description?.includes('Change requested') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                      log.change_description?.includes('Applied') || log.change_description?.includes('applied by') ? 'bg-green-50 text-green-700 border-green-200' :
                                                        log.change_description?.includes('Approved') || log.change_description?.includes('approved by') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                          log.change_description?.includes('Rejected') || log.change_description?.includes('rejected by') ? 'bg-red-50 text-red-700 border-red-200' :
                                                            log.change_description?.includes('Cancelled') || log.change_description?.includes('cancelled by') ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                              'bg-blue-50 text-blue-700 border-blue-200') :
                                                    'bg-red-50 text-red-700 border-red-200'
                                          }`}
                                      >
                                        {log.action === 'approved' ? 'Approved' :
                                          log.action === 'rejected' ? 'Rejected' :
                                            log.action === 'applied' ? 'Applied' :
                                              log.action === 'cancelled' ? 'Cancelled' :
                                                log.change_description?.includes('Change requested') ? 'Change Requested' :
                                                  log.change_description?.includes('Applied') || log.change_description?.includes('applied by') ? 'Applied' :
                                                    log.change_description?.includes('Approved') || log.change_description?.includes('approved by') ? 'Approved' :
                                                      log.change_description?.includes('Rejected') || log.change_description?.includes('rejected by') ? 'Rejected' :
                                                        log.change_description?.includes('Cancelled') || log.change_description?.includes('cancelled by') ? 'Cancelled' :
                                                          log.action}
                                      </Badge>
                                      {log.field_name && (
                                        <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                                          {log.field_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                      )}
                                    </div>
                                    {log.change_description && (
                                      <p className="text-sm text-foreground">
                                        {log.change_description}
                                      </p>
                                    )}
                                    {log.old_value && log.new_value && (
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="p-2 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                                          <div className="font-semibold text-red-700 dark:text-red-400 mb-1">Old Value</div>
                                          <div className="text-red-600 dark:text-red-300 break-words">{log.old_value}</div>
                                        </div>
                                        <div className="p-2 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                                          <div className="font-semibold text-green-700 dark:text-green-400 mb-1">New Value</div>
                                          <div className="text-green-600 dark:text-green-300 break-words">{log.new_value}</div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground text-right whitespace-nowrap">
                                    <div className="font-medium">{format(new Date(log.created_at), 'MMM dd, yyyy')}</div>
                                    <div>{format(new Date(log.created_at), 'HH:mm')}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                              <History className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-sm font-medium mb-1">No changes recorded</h3>
                            <p className="text-xs text-muted-foreground">
                              Changes to this event will appear here
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

              </Tabs>
            </>
          ) : (
            <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm border-dashed">
              <CardContent className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-6">
                  <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Event Selected</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Select an event from the list to view and manage its details, or create a new event to get started
                </p>
                <Button
                  onClick={() => window.location.href = '/dashboard/create-event'}
                  className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Event
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageEvent;
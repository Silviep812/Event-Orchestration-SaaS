import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
/** Change audit: cm_activity + cm_change_logs (RPC); cm_change_requests rows for batched field updates (Deliverable 2). */
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCreateEventEntryPath } from "@/hooks/useCreateEventEntryPath";
import {
  Bell,
  Clock,
  Plus,
  Save,
  AlertCircle,
  History,
  Eye,
  Trash2,
  Calendar as CalendarIcon,
  BarChart3,
  ClipboardList,
  Lock,
  Loader2,
  ChevronUp,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import TimelineView from "@/components/timeline/TimelineView";
import { getLifecycleTableBadge, isEventPastBySchedule } from "@/lib/eventStatus";
import {
  commentsPlannerCopy,
  plannerSafeErrorToastDescription,
  plannerToolsCopy,
} from "@/lib/nudges";
import Analytics from "@/components/Analytics";
import { TaskManager } from "@/components/TaskManager";
import { EventChangeRequestsList } from "@/components/change-management/EventChangeRequestsList";
import { Checkbox } from "@/components/ui/checkbox";
import {
  dedupeSportThemesForPicker,
  isHealthWellnessThemeName,
  isRetreatsThemeName,
  isSportThemeName,
  loadHealthWellnessEventTypeGroups,
  loadRetreatsEventTypeGroups,
  loadSportingLeafEventTypes,
  sportThemeRootCategoryDisplayLabel,
  sportingUiName,
} from "@/lib/themeEventTypeHierarchy";
import type { RolloutTiming } from "@/lib/changeRequestRollout";
import { ROLLOUT_TIMING_LABELS, taskPriorityFromRollout } from "@/lib/changeRequestRollout";
import { notifyStakeholdersUrgentChangeRequest } from "@/lib/urgentChangeRequestNotifications";

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
  entertainment_ids?: string[] | null;
  /** External Vendor / procurement (`suppliers` table), not serv_vendor_suppliers. */
  external_supplier_ids?: string[] | null;
  serv_vendor_rental_id?: string | null;
  service_vendor_id?: string | null;
  service_vendor_ids?: string[] | null;
  archived?: boolean;
  /** When true, venue booking is done and schedule fields are locked until cleared. */
  venue_booking_completed?: boolean;
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

/** Merges `cm_change_logs` (log_change RPC) with `cm_activity` (triggers + explicit inserts) per client PDF / Deliverable 1. */
type UnifiedChangelogEntry =
  | { source: "cm_change_logs"; id: string; created_at: string; log: ChangeLog }
  | {
      source: "cm_activity";
      id: string;
      created_at: string;
      activity: {
        action: string;
        entity_type: string;
        entity_id: string | null;
        metadata: Record<string, unknown> | null;
        changed_by: string | null;
      };
    };

interface NewRequest {
  title: string;
  description: string;
  rolloutTiming: RolloutTiming;
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

const ManageEvent = () => {
  const [events, setEvents] = useState<ManageEventData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ManageEventData | null>(null);
  const [unifiedChangelog, setUnifiedChangelog] = useState<UnifiedChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [pendingChanges, setPendingChanges] = useState<{[key: string]: {oldValue: any, newValue: any}}>({});
  const [newRequestDialog, setNewRequestDialog] = useState(false);
  const [submittingNewRequest, setSubmittingNewRequest] = useState(false);
  const [newRequest, setNewRequest] = useState<NewRequest>({
    title: '',
    description: '',
    rolloutTiming: 'optional',
    type: 'change_request'
  });
  const [eventThemes, setEventThemes] = useState<EventTheme[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  /** Same Health & Wellness / Retreats hierarchy as Create Event + Browse Themes. */
  const [hwHierarchy, setHwHierarchy] = useState<Awaited<
    ReturnType<typeof loadHealthWellnessEventTypeGroups>
  > | null>(null);
  const [retreatHierarchy, setRetreatHierarchy] = useState<Awaited<
    ReturnType<typeof loadRetreatsEventTypeGroups>
  > | null>(null);
  const [hwCategoryKey, setHwCategoryKey] = useState<string>("");
  const [retreatBranchLabel, setRetreatBranchLabel] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [sportingLeafTypes, setSportingLeafTypes] = useState<{ id: number; name: string }[]>([]);
  const [showPastEvents, setShowPastEvents] = useState(false);
  /** When true, include archived events in the sidebar list (default: only active events). */
  const [showArchivedEvents, setShowArchivedEvents] = useState(false);
  const [entertainmentOptions, setEntertainmentOptions] = useState<
    { id: string; business_name: string; ent_type_id: number | null }[]
  >([]);
  const [entertainmentTypes, setEntertainmentTypes] = useState<{ id: number; name: string }[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<
    { id: string; business_name: string; category_id: number | null }[]
  >([]);
  const [supplierCategories, setSupplierCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedEntTypeFilter, setSelectedEntTypeFilter] = useState<number | null>(null);
  const [selectedSupplierCategoryFilter, setSelectedSupplierCategoryFilter] = useState<number | null>(null);
  const [selectedEntIds, setSelectedEntIds] = useState<string[]>([]);
  const [selectedSvcIds, setSelectedSvcIds] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const createEventPath = useCreateEventEntryPath();
  const [searchParams] = useSearchParams();
  const eventIdFromUrl = searchParams.get("eventId");

  const selectedThemeName = useMemo(
    () => eventThemes.find((t) => t.id === selectedEvent?.theme_id)?.name ?? "",
    [eventThemes, selectedEvent?.theme_id],
  );

  const themeHierarchyMode = useMemo((): "default" | "hw" | "retreats" | "sporting" => {
    if (!selectedThemeName) return "default";
    if (isHealthWellnessThemeName(selectedThemeName)) return "hw";
    if (isRetreatsThemeName(selectedThemeName)) return "retreats";
    if (isSportThemeName(selectedThemeName)) return "sporting";
    return "default";
  }, [selectedThemeName]);

  // Auto-save debounce
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [budgetInput, setBudgetInput] = useState<string>('');
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Resource sync trigger
  const [resourceRefreshKey, setResourceRefreshKey] = useState(0);
  /** Bumps `EventChangeRequestsList` after collaborator / Manage Event submissions. */
  const [changeRequestRefreshKey, setChangeRequestRefreshKey] = useState(0);

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
        description: plannerToolsCopy.syncLocationFailed,
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
          if (!showPastEvents && isEventPastBySchedule(ev)) return false;
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
        description: plannerToolsCopy.eventsLoadFailed,
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
      const raw = data || [];
      const keptIds = new Set(
        dedupeSportThemesForPicker(
          raw.map((t) => ({ id: t.id, name: t.name ?? "", premium: t.premium })),
        ).map((t) => t.id),
      );
      setEventThemes(
        raw
          .filter((t) => keptIds.has(t.id))
          .map((t) => ({ id: t.id, name: t.name, premium: Boolean(t.premium) })),
      );
    } catch (error) {
      console.error('Error fetching themes:', error);
    }
  };

  useEffect(() => {
    (async () => {
      const [{ data: ent }, { data: entT }, { data: sup }, { data: supCat }] = await Promise.all([
        supabase.from("entertainments").select("id, business_name, ent_type_id").order("business_name"),
        supabase.from("entertainment_types").select("id, name").order("name"),
        supabase.from("suppliers").select("id, business_name, category_id").order("business_name"),
        supabase.from("supplier_categories").select("id, name").order("name"),
      ]);
      setEntertainmentOptions(ent || []);
      setEntertainmentTypes(entT || []);
      setSupplierOptions(sup || []);
      setSupplierCategories(supCat || []);
    })();
  }, []);

  useEffect(() => {
    if (!selectedEvent?.id) return;
    const ent =
      selectedEvent.entertainment_ids?.length
        ? [...selectedEvent.entertainment_ids]
        : selectedEvent.entertainment_id
          ? [selectedEvent.entertainment_id]
          : [];
    const ext =
      selectedEvent.external_supplier_ids?.length
        ? [...selectedEvent.external_supplier_ids]
        : [];
    setSelectedEntIds(ent);
    setSelectedSvcIds(ext);
  }, [selectedEvent?.id]);

  const fetchEventTypes = async (themeId?: number) => {
    try {
      if (!themeId) {
        setEventTypes([]);
        return;
      }
      const { data, error } = await supabase
        .from("event_types")
        .select("id, name, theme_id, parent_id")
        .eq("theme_id", themeId)
        .order("name");
      if (error) throw error;
      setEventTypes(data || []);
    } catch (error) {
      console.error("Error fetching event types:", error);
      setEventTypes([]);
    }
  };

  const fetchUnifiedChangelog = async (entityId: string) => {
    try {
      const [logsRes, activityRes] = await Promise.all([
        supabase
          .from("cm_change_logs")
          .select("*")
          .eq("entity_id", entityId)
          .eq("entity_type", "event")
          .order("created_at", { ascending: false }),
        supabase
          .from("cm_activity")
          .select("id, created_at, action, entity_type, entity_id, metadata, changed_by")
          .eq("event_id", entityId)
          .order("created_at", { ascending: false }),
      ]);

      if (logsRes.error) throw logsRes.error;
      if (activityRes.error) {
        console.warn("cm_activity fetch (optional migration):", activityRes.error);
      }

      const logs = (logsRes.data || []) as ChangeLog[];
      const activities = activityRes.data || [];

      const merged: UnifiedChangelogEntry[] = [
        ...logs.map((log) => ({
          source: "cm_change_logs" as const,
          id: `cl-${log.id}`,
          created_at: log.created_at,
          log,
        })),
        ...activities.map((row) => ({
          source: "cm_activity" as const,
          id: `cm-${row.id}`,
          created_at: row.created_at,
          activity: {
            action: row.action,
            entity_type: row.entity_type,
            entity_id: row.entity_id,
            metadata: (row.metadata as Record<string, unknown> | null) ?? null,
            changed_by: row.changed_by,
          },
        })),
      ]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

      setUnifiedChangelog(merged);
    } catch (error) {
      console.error("Error fetching unified changelog:", error);
      setUnifiedChangelog([]);
    }
  };

  const saveEvent = async (
    eventData: ManageEventData,
    isManual = false,
    profileOverride?: { entIds: string[]; svcIds: string[] }
  ) => {
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

      const entIdsUse = profileOverride?.entIds ?? selectedEntIds;
      const svcIdsUse = profileOverride?.svcIds ?? selectedSvcIds;
      const entId = entIdsUse[0] ?? null;
      const svcId = svcIdsUse[0] ?? null;

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
          expected_attendees: eventData.expected_attendees,
          updated_at: new Date().toISOString(),
          entertainment_id: entId,
          entertainment_ids: entIdsUse.length ? entIdsUse : null,
          external_supplier_ids: svcIdsUse.length ? svcIdsUse : null,
          service_vendor_id: null,
          service_vendor_ids: null,
          venue_booking_completed: eventData.venue_booking_completed ?? false,
        })
        .eq("id", eventData.id);

      if (error) throw error;

      // Sync details to resources after successful save
      await syncDetailsToResources(eventData);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("iep-refetch-tasks"));
      }
      setResourceRefreshKey((k) => k + 1);

      if (isManual) {
        toast({
          title: "Success",
          description: "Event saved successfully",
        });
        if (user?.email && eventData.id) {
          void supabase.functions.invoke("send-event-notification", {
            body: {
              kind: "event_updated",
              eventTitle: eventData.title,
              eventId: eventData.id,
              userEmail: user.email,
              userId: user.id,
            },
          });
        }

        const changeEntries = Object.entries(pendingChanges);
        for (const [field, change] of changeEntries) {
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

        if (changeEntries.length > 0 && eventData.id && user?.id) {
          const first = changeEntries[0];
          const { error: crErr } = await supabase.from("cm_change_requests").insert({
            event_id: eventData.id,
            requested_by: user.id,
            description: `Event update (${changeEntries.length} field(s))`,
            status: "approved",
            rollout_timing: "optional",
            field_changed: changeEntries.map(([f]) => f).join(", "),
            old_value: first?.[1]?.oldValue?.toString() ?? null,
            new_value: first?.[1]?.newValue?.toString() ?? null,
          });
          if (crErr) console.warn("cm_change_requests insert:", crErr);
        }

        setPendingChanges({});
      }
      
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: plannerSafeErrorToastDescription(error, commentsPlannerCopy.toastGeneric),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleEntertainmentId = (profileId: string, checked: boolean) => {
    if (!selectedEvent?.id) return;
    const newEnt = checked
      ? [...selectedEntIds, profileId]
      : selectedEntIds.filter((x) => x !== profileId);
    const merged: ManageEventData = {
      ...selectedEvent,
      entertainment_id: newEnt[0] ?? null,
      entertainment_ids: newEnt.length ? newEnt : null,
    };
    setSelectedEntIds(newEnt);
    setSelectedEvent(merged);
    setEvents((prev) => prev.map((e) => (e.id === merged.id ? merged : e)));
    if (autoSave) {
      if (saveTimeout) clearTimeout(saveTimeout);
      const t = setTimeout(
        () => saveEvent(merged, false, { entIds: newEnt, svcIds: selectedSvcIds }),
        1000
      );
      setSaveTimeout(t);
    }
  };

  const toggleServiceVendorId = (profileId: string, checked: boolean) => {
    if (!selectedEvent?.id) return;
    const newSvc = checked
      ? [...selectedSvcIds, profileId]
      : selectedSvcIds.filter((x) => x !== profileId);
    const merged: ManageEventData = {
      ...selectedEvent,
      external_supplier_ids: newSvc.length ? newSvc : null,
      service_vendor_id: null,
      service_vendor_ids: null,
    };
    setSelectedSvcIds(newSvc);
    setSelectedEvent(merged);
    setEvents((prev) => prev.map((e) => (e.id === merged.id ? merged : e)));
    if (autoSave) {
      if (saveTimeout) clearTimeout(saveTimeout);
      const t = setTimeout(
        () => saveEvent(merged, false, { entIds: selectedEntIds, svcIds: newSvc }),
        1000
      );
      setSaveTimeout(t);
    }
  };

  const handleFieldChange = async (field: string, value: any) => {
    if (!selectedEvent) return;

    if (
      selectedEvent.venue_booking_completed &&
      (field === "start_date" || field === "end_date" || field === "start_time" || field === "end_time")
    ) {
      toast({
        title: "Schedule locked",
        description:
          "Start and end dates and times are locked after the venue booking is marked complete. Create a new event if you need a different schedule.",
        variant: "destructive",
      });
      return;
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

  const handleThemeSelect = async (themeId: number) => {
    if (!selectedEvent) return;
    const oldTheme = selectedEvent.theme_id;
    const oldType = selectedEvent.type_id;
    if (oldTheme === themeId) return;
    const updatedEvent = { ...selectedEvent, theme_id: themeId, type_id: undefined };
    setSelectedEvent(updatedEvent);
    setEvents((prev) => prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
    setSelectedCategoryId(null);
    setHwCategoryKey("");
    setRetreatBranchLabel("");

    if (selectedEvent.id) {
      if (autoSave) {
        try {
          await supabase.rpc("log_change", {
            p_entity_type: "event",
            p_entity_id: selectedEvent.id,
            p_action: "updated",
            p_field_name: "theme_id",
            p_old_value: oldTheme?.toString() ?? null,
            p_new_value: themeId.toString(),
            p_description: `Field "theme_id" updated`,
          });
          if (oldType != null) {
            await supabase.rpc("log_change", {
              p_entity_type: "event",
              p_entity_id: selectedEvent.id,
              p_action: "updated",
              p_field_name: "type_id",
              p_old_value: oldType.toString(),
              p_new_value: null,
              p_description: `Field "type_id" cleared (theme change)`,
            });
          }
        } catch (error) {
          console.error("Error logging field change:", error);
        }
      } else {
        setPendingChanges((prev) => ({
          ...prev,
          theme_id: { oldValue: oldTheme, newValue: themeId },
          ...(oldType != null ? { type_id: { oldValue: oldType, newValue: undefined } } : {}),
        }));
      }
    }

    if (autoSave) {
      if (saveTimeout) clearTimeout(saveTimeout);
      const t = setTimeout(() => saveEvent(updatedEvent, false), 1000);
      setSaveTimeout(t);
    }
  };

  const clearEventTypeId = async (reason: string) => {
    if (!selectedEvent) return;
    const oldType = selectedEvent.type_id;
    if (oldType == null) return;
    const updatedEvent = { ...selectedEvent, type_id: undefined };
    setSelectedEvent(updatedEvent);
    setEvents((prev) => prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));

    if (selectedEvent.id) {
      if (autoSave) {
        try {
          await supabase.rpc("log_change", {
            p_entity_type: "event",
            p_entity_id: selectedEvent.id,
            p_action: "updated",
            p_field_name: "type_id",
            p_old_value: oldType.toString(),
            p_new_value: null,
            p_description: reason,
          });
        } catch (error) {
          console.error("Error logging field change:", error);
        }
      } else {
        setPendingChanges((prev) => ({
          ...prev,
          type_id: { oldValue: oldType, newValue: undefined },
        }));
      }
    }

    if (autoSave) {
      if (saveTimeout) clearTimeout(saveTimeout);
      const t = setTimeout(() => saveEvent(updatedEvent, false), 1000);
      setSaveTimeout(t);
    }
  };

  const handleHwCategorySelect = async (k: string) => {
    if (!selectedEvent || !hwHierarchy) return;
    const pid = hwHierarchy.parentIds[k];
    setHwCategoryKey(k);
    setSelectedCategoryId(pid ?? null);
    await clearEventTypeId(`Field "type_id" cleared (${k} category change)`);
  };

  const handleRetreatBranchSelect = async (branch: string) => {
    if (!selectedEvent || !retreatHierarchy) return;
    const rid = retreatHierarchy.rootIdByBranch[branch];
    setRetreatBranchLabel(branch);
    setSelectedCategoryId(rid ?? null);
    await clearEventTypeId(`Field "type_id" cleared (retreat branch change)`);
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
    const titleOk = newRequest.title.trim().length > 0;
    const descOk = newRequest.description.trim().length > 0;
    if (!titleOk || !descOk || submittingNewRequest) return;

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
    setSubmittingNewRequest(true);
    try {
      const taskPriority = taskPriorityFromRollout(newRequest.rolloutTiming);
      const coordTitle =
        newRequest.rolloutTiming === "urgent"
          ? `URGENT — New ${newRequest.type.replace("_", " ")}: ${newRequest.title.trim()}`
          : `New ${newRequest.type.replace("_", " ")}: ${newRequest.title.trim()}`;

      const { data: taskRow, error: taskErr } = await supabase
        .from("tasks")
        .insert({
          title: `[${newRequest.type.replace(/_/g, " ")}] ${newRequest.title.trim()}`,
          description: newRequest.description.trim(),
          event_id: selectedEvent.id,
          priority: taskPriority,
          status: "not_started",
          category: "Change Management",
          created_by: user.id,
          archived: false,
        })
        .select("id")
        .single();
      if (taskErr) throw taskErr;

      if (taskRow?.id) {
        const { error: crErr } = await supabase.from("cm_change_requests").insert({
          event_id: selectedEvent.id,
          description: newRequest.description.trim(),
          field_changed: "manage_event_new_request",
          priority_tag: taskPriority,
          rollout_timing: newRequest.rolloutTiming,
          requested_by: user.id,
          status: "open",
          task_id: taskRow.id,
        });
        if (crErr) console.warn("cm_change_requests:", crErr);

        const { error: actErr } = await supabase.from("cm_activity" as any).insert({
          event_id: selectedEvent.id,
          entity_type: "task",
          entity_id: taskRow.id,
          action: "created",
          changed_by: user.id,
          metadata: {
            source: "manage_event_new_request",
            title: newRequest.title.trim(),
            task_title: `[${newRequest.type.replace(/_/g, " ")}] ${newRequest.title.trim()}`,
          },
        });
        if (actErr) console.warn("cm_activity (new request):", actErr);
      }

      await supabase.rpc("notify_coordinators", {
        p_title: coordTitle,
        p_message: newRequest.description.trim(),
        p_type: "new_request",
        p_entity_type: "event",
        p_entity_id: selectedEvent.id,
      });

      if (newRequest.rolloutTiming === "urgent" && user.id) {
        try {
          await notifyStakeholdersUrgentChangeRequest({
            eventId: selectedEvent.id,
            senderId: user.id,
            requestTitle: newRequest.title.trim(),
            requestDescription: newRequest.description.trim(),
          });
        } catch (e) {
          console.warn("notifyStakeholdersUrgentChangeRequest:", e);
        }
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("iep-refetch-tasks"));
      }
      setResourceRefreshKey((k) => k + 1);
      setChangeRequestRefreshKey((k) => k + 1);
      if (selectedEvent.id) {
        void fetchUnifiedChangelog(selectedEvent.id);
      }

      toast({
        title: "Request submitted",
        description:
          "A task and change request were added. Review them on this tab below, in Project Management → Task, or under Change Management.",
      });

      setNewRequestDialog(false);
      setNewRequest({
        title: "",
        description: "",
        rolloutTiming: "optional",
        type: "change_request",
      });
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Error",
        description: plannerSafeErrorToastDescription(error, commentsPlannerCopy.toastGeneric),
        variant: "destructive",
      });
    } finally {
      setSubmittingNewRequest(false);
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
        description: plannerSafeErrorToastDescription(error, commentsPlannerCopy.toastGeneric),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
      .channel("change-logs-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cm_change_logs" },
        () => {
          if (selectedEvent?.id) {
            void fetchUnifiedChangelog(selectedEvent.id);
          }
        }
      )
      .subscribe();

    const cmActivityChannel = supabase
      .channel("cm-activity-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cm_activity" },
        () => {
          if (selectedEvent?.id) {
            void fetchUnifiedChangelog(selectedEvent.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(changeLogsChannel);
      supabase.removeChannel(cmActivityChannel);
    };
  }, [selectedEvent?.id]);

  useEffect(() => {
    if (!user) return;
    void fetchThemes();
  }, [user]);

  useEffect(() => {
    void loadSportingLeafEventTypes().then(setSportingLeafTypes);
  }, []);

  useEffect(() => {
    if (!selectedEvent?.theme_id) {
      setEventTypes([]);
      setHwHierarchy(null);
      setRetreatHierarchy(null);
      setHwCategoryKey("");
      setRetreatBranchLabel("");
      return;
    }
    if (eventThemes.length === 0) return;

    const tid = selectedEvent.theme_id;
    const tname = eventThemes.find((t) => t.id === tid)?.name ?? "";

    if (isHealthWellnessThemeName(tname)) {
      setEventTypes([]);
      void loadHealthWellnessEventTypeGroups().then(setHwHierarchy);
      setRetreatHierarchy(null);
      setRetreatBranchLabel("");
      return;
    }
    if (isRetreatsThemeName(tname)) {
      setEventTypes([]);
      void loadRetreatsEventTypeGroups().then(setRetreatHierarchy);
      setHwHierarchy(null);
      setHwCategoryKey("");
      return;
    }
    if (isSportThemeName(tname)) {
      setEventTypes([]);
      setRetreatHierarchy(null);
      setHwHierarchy(null);
      setHwCategoryKey("");
      setRetreatBranchLabel("");
      return;
    }
    setHwHierarchy(null);
    setRetreatHierarchy(null);
    setHwCategoryKey("");
    setRetreatBranchLabel("");
    void fetchEventTypes(tid);
  }, [selectedEvent?.theme_id, eventThemes]);

  useEffect(() => {
    if (user) fetchEvents();
  }, [user, showPastEvents, showArchivedEvents]);

  /** Deep link: /dashboard/manage-event?eventId=… */
  useEffect(() => {
    if (!eventIdFromUrl || !user?.id) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventIdFromUrl)
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) return;
      const ev = data as ManageEventData;
      if (ev.archived) setShowArchivedEvents(true);
      if (isEventPastBySchedule(ev)) setShowPastEvents(true);
      setSelectedEvent({
        ...ev,
        theme_id: ev.theme_id ? Number(ev.theme_id) : undefined,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [eventIdFromUrl, user?.id]);

  useEffect(() => {
    if (selectedEvent?.id) {
      void fetchUnifiedChangelog(selectedEvent.id);
    }
  }, [selectedEvent?.id]);

  /** After an approved CM change updates the event in another surface, refetch this event into state. */
  useEffect(() => {
    const id = selectedEvent?.id;
    if (!id) return;
    const onCascade = (ev: Event) => {
      const detail = (ev as CustomEvent<{ eventId?: string }>).detail;
      if (detail?.eventId !== id) return;
      void (async () => {
        const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
        if (error || !data) return;
        const row = data as ManageEventData;
        const normalized: ManageEventData = {
          ...row,
          theme_id: row.theme_id ? Number(row.theme_id) : undefined,
        };
        setSelectedEvent(normalized);
        setEvents((prev) => prev.map((e) => (e.id === id ? normalized : e)));
        setResourceRefreshKey((k) => k + 1);
      })();
    };
    window.addEventListener("iep-event-updated", onCascade);
    return () => window.removeEventListener("iep-event-updated", onCascade);
  }, [selectedEvent?.id]);

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 420);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sync budget input with selectedEvent.budget
  useEffect(() => {
    if (selectedEvent && selectedEvent.budget !== undefined && selectedEvent.budget !== null) {
      setBudgetInput(Number(selectedEvent.budget).toFixed(2));
    } else {
      setBudgetInput('');
    }
  }, [selectedEvent?.budget]);

  // Infer Event Category from type_id (default themes only — HW/Retreats use dedicated effects below)
  useEffect(() => {
    if (themeHierarchyMode !== "default") return;
    if (!selectedEvent?.type_id || eventTypes.length === 0) return;
    const currentType = eventTypes.find((t) => t.id === selectedEvent.type_id);
    if (!currentType) return;
    if (currentType.parent_id) {
      setSelectedCategoryId(currentType.parent_id);
    } else {
      setSelectedCategoryId(currentType.id);
    }
  }, [selectedEvent?.type_id, eventTypes, themeHierarchyMode]);

  // Health & Wellness: infer category (Peaceful/…) + leaf from saved type_id
  useEffect(() => {
    if (!selectedEvent?.type_id || !selectedEvent.theme_id) return;
    if (!isHealthWellnessThemeName(selectedThemeName) || !hwHierarchy) return;
    for (const k of hwHierarchy.orderedCategoryKeys) {
      const leaf = (hwHierarchy.groups[k] ?? []).find((x) => x.id === selectedEvent.type_id);
      const pid = hwHierarchy.parentIds[k];
      if (leaf && pid) {
        setHwCategoryKey(k);
        setSelectedCategoryId(pid);
        return;
      }
    }
  }, [selectedEvent?.type_id, selectedEvent?.theme_id, hwHierarchy, selectedThemeName]);

  // Retreats: infer branch + leaf from saved type_id
  useEffect(() => {
    if (!selectedEvent?.type_id || !selectedEvent.theme_id) return;
    if (!isRetreatsThemeName(selectedThemeName) || !retreatHierarchy) return;
    for (const branch of Object.keys(retreatHierarchy.typesByBranch)) {
      const leaf = (retreatHierarchy.typesByBranch[branch] ?? []).find(
        (x) => x.id === selectedEvent.type_id,
      );
      const rid = retreatHierarchy.rootIdByBranch[branch];
      if (leaf && rid) {
        setRetreatBranchLabel(branch);
        setSelectedCategoryId(rid);
        return;
      }
    }
  }, [selectedEvent?.type_id, selectedEvent?.theme_id, retreatHierarchy, selectedThemeName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Manage Event
          </h1>
          <p className="text-muted-foreground">
            Select an event in the list, then use tabs for details, timeline, change requests, analytics, and change log. Use{" "}
            <span className="font-medium text-foreground">Show past</span> /{" "}
            <span className="font-medium text-foreground">Show archived</span> in the Events card to widen the list.{" "}
            <span className="font-medium text-foreground">New Request</span> needs an active (non-archived) event. Use{" "}
            <span className="font-medium text-foreground">Restore event</span> after turning on{" "}
            <span className="font-medium text-foreground">Show archived</span>.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:justify-end max-w-full min-w-0">
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
          <Dialog
            open={newRequestDialog}
            onOpenChange={(open) => {
              setNewRequestDialog(open);
              if (!open) setSubmittingNewRequest(false);
            }}
          >
            <DialogContent className="w-full max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Submit New Request</DialogTitle>
                <DialogDescription>
                  Describe the change or issue. Coordinators will be notified.
                </DialogDescription>
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
                  <Label htmlFor="request-rollout">Rollout timing</Label>
                  <Select
                    value={newRequest.rolloutTiming}
                    onValueChange={(value: RolloutTiming) =>
                      setNewRequest((prev) => ({ ...prev, rolloutTiming: value }))
                    }
                  >
                    <SelectTrigger id="request-rollout">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ROLLOUT_TIMING_LABELS) as RolloutTiming[]).map((k) => (
                        <SelectItem key={k} value={k}>
                          {ROLLOUT_TIMING_LABELS[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Urgent sends in-app notifications to stakeholders for this event.
                  </p>
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

                {newRequest.title.trim().length > 0 && newRequest.description.trim().length > 0 ? (
                  <Button
                    type="button"
                    onClick={() => void submitNewRequest()}
                    className="w-full bg-gradient-primary hover:opacity-90"
                    disabled={submittingNewRequest}
                  >
                    {submittingNewRequest ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Bell className="h-4 w-4 mr-2" />
                    )}
                    {submittingNewRequest ? "Submitting…" : "Submit & Notify Coordinators"}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    Enter a title and description to submit.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events List */}
        <Card className="lg:col-span-1 shadow-elegant border-0 bg-gradient-subtle">
          <CardHeader className="border-b border-border/50">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between min-w-0">
              <CardTitle className="flex items-center gap-2 min-w-0 shrink">
                <Clock className="h-5 w-5 text-primary shrink-0" />
                <span className="truncate">Events</span>
              </CardTitle>
              <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2 shrink-0">
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
            <div className="max-h-[calc(100dvh-11rem)] overflow-y-auto">
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
                  , or{" "}
                  <button
                    type="button"
                    className="text-primary underline underline-offset-2 font-medium"
                    onClick={() => navigate(createEventPath)}
                  >
                    create an event
                  </button>
                  .
                </div>
              ) : (
                events.map((event, index) => {
                  const lifecycleBadge = getLifecycleTableBadge({
                    status: event.status,
                    start_date: event.start_date,
                    end_date: event.end_date,
                    archived: event.archived,
                  });
                  return (
                  <div
                    key={event.id || index}
                    className={`p-4 border-b border-border/30 cursor-pointer transition-all hover:bg-surface/50 ${
                      selectedEvent?.id === event.id ? "bg-primary/10 border-l-4 border-l-primary" : ""
                    }`}
                    onClick={() => {
                      setSelectedEvent(event);
                      setSelectedCategoryId(null);
                    }}
                  >
                    <div className="font-medium text-sm truncate">{event.title || "Unnamed Event"}</div>
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge
                        variant={lifecycleBadge.variant}
                        className="text-[10px] px-1.5 py-0 h-5 capitalize font-normal"
                      >
                        {lifecycleBadge.label}
                      </Badge>
                    </div>
                    {event.start_date && (
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(event.start_date + "T00:00:00"), "MMM dd, yyyy")}
                      </div>
                    )}
                  </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Event Details & Change Logs */}
        <div className="lg:col-span-2 space-y-6">
          {selectedEvent ? (
            <Tabs defaultValue="details" className="space-y-4">
              <div className="overflow-x-auto pb-1">
                <TabsList className="grid grid-cols-5 min-w-[56rem] w-full h-auto p-1 gap-1 items-stretch">
                <TabsTrigger value="details" className="min-w-0 flex items-center justify-center gap-1.5 text-xs sm:text-sm py-2 px-2 h-10 whitespace-nowrap text-center">
                  <Eye className="h-4 w-4 shrink-0" />
                  <span>Manage Event</span>
                </TabsTrigger>
                <TabsTrigger value="timeline" className="min-w-0 flex items-center justify-center gap-1.5 text-xs sm:text-sm py-2 px-2 h-10 whitespace-nowrap text-center">
                  <CalendarIcon className="h-4 w-4 shrink-0" />
                  <span>Event Timeline</span>
                </TabsTrigger>
                <TabsTrigger value="change-request" className="min-w-0 flex items-center justify-center gap-1.5 text-xs sm:text-sm py-2 px-2 h-10 whitespace-nowrap text-center">
                  <ClipboardList className="h-4 w-4 shrink-0" />
                  <span>Change requests</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="min-w-0 flex items-center justify-center gap-1.5 text-xs sm:text-sm py-2 px-2 h-10 whitespace-nowrap text-center">
                  <BarChart3 className="h-4 w-4 shrink-0" />
                  <span>Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="changelog" className="min-w-0 flex items-center justify-center gap-1.5 text-xs sm:text-sm py-2 px-2 h-10 whitespace-nowrap text-center">
                  <History className="h-4 w-4 shrink-0" />
                  <span>Change Log ({unifiedChangelog.length})</span>
                </TabsTrigger>
              </TabsList>
              </div>

              <TabsContent value="details">
                <Card className="shadow-elegant border-0 bg-gradient-subtle">
                  <CardHeader className="border-b border-border/50">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle>Manage Event</CardTitle>
                        <p className="text-sm text-muted-foreground font-normal mt-1">Event details &amp; theme</p>
                      </div>
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
                          disabled={selectedEvent.venue_booking_completed === true}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="end-date">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={selectedEvent.end_date || ''}
                          onChange={(e) => handleFieldChange('end_date', e.target.value)}
                          disabled={selectedEvent.venue_booking_completed === true}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="start-time">Start Time</Label>
                        <Input
                          id="start-time"
                          type="time"
                          value={selectedEvent.start_time ? selectedEvent.start_time.slice(0, 5) : ''}
                          onChange={(e) => handleFieldChange('start_time', e.target.value)}
                          disabled={selectedEvent.venue_booking_completed === true}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="end-time">End Time</Label>
                        <Input
                          id="end-time"
                          type="time"
                          value={selectedEvent.end_time ? selectedEvent.end_time.slice(0, 5) : ''}
                          onChange={(e) => handleFieldChange('end_time', e.target.value)}
                          disabled={selectedEvent.venue_booking_completed === true}
                        />
                      </div>

                      {selectedEvent.venue_booking_completed ? (
                        <Alert className="md:col-span-2 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                          <Lock className="h-4 w-4" />
                          <AlertTitle>Schedule locked</AlertTitle>
                          <AlertDescription>
                            Venue booking is marked complete. Start/end dates and times cannot be edited until you
                            clear the confirmation below. For a different schedule after a completed booking, create a
                            new event if required by your process.
                          </AlertDescription>
                        </Alert>
                      ) : null}

                      <div className="flex items-start gap-3 rounded-lg border p-4 md:col-span-2">
                        <Checkbox
                          id="venue-booking-completed"
                          checked={selectedEvent.venue_booking_completed === true}
                          onCheckedChange={(c) => void handleFieldChange("venue_booking_completed", c === true)}
                        />
                        <div className="space-y-1">
                          <label htmlFor="venue-booking-completed" className="text-sm font-medium leading-none cursor-pointer">
                            Venue booking transaction completed
                          </label>
                          <p className="text-xs text-muted-foreground">
                            When saved, this locks event start/end date and start/end time. Uncheck to allow edits again
                            if your team approves an exception.
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="theme">Event theme</Label>
                        <Select
                          value={selectedEvent.theme_id?.toString() || ""}
                          onValueChange={(value) => void handleThemeSelect(parseInt(value, 10))}
                        >
                          <SelectTrigger className="bg-background border-border z-50">
                            <SelectValue placeholder="Choose theme for this event" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border shadow-lg z-50">
                            {eventThemes.map((theme) => (
                              <SelectItem key={theme.id} value={theme.id.toString()}>
                                {sportingUiName(theme.name)}
                                {theme.premium ? " (Premium)" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {themeHierarchyMode === "hw" && hwHierarchy && (
                        <>
                          <div>
                            <Label>Category (Health &amp; Wellness)</Label>
                            <Select
                              value={hwCategoryKey || undefined}
                              onValueChange={(v) => void handleHwCategorySelect(v)}
                            >
                              <SelectTrigger className="bg-background border-border z-50">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-border shadow-lg z-50">
                                {hwHierarchy.orderedCategoryKeys.map((k) => {
                                  const pid = hwHierarchy.parentIds[k];
                                  if (!pid) return null;
                                  const label = hwHierarchy.keyLabel[k] ?? k;
                                  return (
                                    <SelectItem key={k} value={k}>
                                      {label}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          {hwCategoryKey ? (
                            <div>
                              <Label htmlFor="eventType-hw">Event type</Label>
                              <Select
                                value={selectedEvent.type_id?.toString() || ""}
                                onValueChange={(value) => handleFieldChange("type_id", parseInt(value, 10))}
                              >
                                <SelectTrigger className="bg-background border-border z-50" id="eventType-hw">
                                  <SelectValue placeholder="Select specific event type" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border shadow-lg z-50">
                                  {(hwHierarchy.groups[hwCategoryKey] ?? []).map((row) => (
                                    <SelectItem key={row.id} value={row.id.toString()}>
                                      {row.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : null}
                        </>
                      )}

                      {themeHierarchyMode === "retreats" && retreatHierarchy && (
                        <>
                          <div>
                            <Label>Retreat branch</Label>
                            <Select
                              value={retreatBranchLabel}
                              onValueChange={(b) => void handleRetreatBranchSelect(b)}
                            >
                              <SelectTrigger className="bg-background border-border z-50">
                                <SelectValue placeholder="Select branch" />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-border shadow-lg z-50">
                                {Object.keys(retreatHierarchy.typesByBranch).map((b) => (
                                  <SelectItem key={b} value={b}>
                                    {b}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {retreatBranchLabel ? (
                            <div>
                              <Label htmlFor="eventType-retreat">Event type</Label>
                              <Select
                                value={selectedEvent.type_id?.toString() || ""}
                                onValueChange={(value) => handleFieldChange("type_id", parseInt(value, 10))}
                              >
                                <SelectTrigger className="bg-background border-border z-50" id="eventType-retreat">
                                  <SelectValue placeholder="Select specific event type" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border shadow-lg z-50">
                                  {(retreatHierarchy.typesByBranch[retreatBranchLabel] ?? []).map((row) => (
                                    <SelectItem key={row.id} value={row.id.toString()}>
                                      {row.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : null}
                        </>
                      )}

                      {themeHierarchyMode === "sporting" && (
                        <div>
                          <Label htmlFor="eventType-sporting">Event type</Label>
                          <Select
                            value={selectedEvent.type_id?.toString() || ""}
                            onValueChange={(value) => handleFieldChange("type_id", parseInt(value, 10))}
                            disabled={!selectedEvent.theme_id}
                          >
                            <SelectTrigger className="bg-background border-border z-50" id="eventType-sporting">
                              <SelectValue
                                placeholder={selectedEvent.theme_id ? "Select event type" : "Select theme first"}
                              />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-border shadow-lg z-50">
                              {sportingLeafTypes.map((row) => (
                                <SelectItem key={row.id} value={row.id.toString()}>
                                  {row.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedEvent.theme_id && sportingLeafTypes.length === 0 ? (
                            <p className="text-xs text-muted-foreground mt-1">
                              {plannerToolsCopy.sportingTypesUnavailable}
                            </p>
                          ) : null}
                        </div>
                      )}

                      {themeHierarchyMode === "default" && (
                        <>
                          <div>
                            <Label htmlFor="eventCategory">Event Category</Label>
                            <Select
                              value={selectedCategoryId?.toString() || ""}
                              onValueChange={(value) => {
                                const catId = parseInt(value, 10);
                                setSelectedCategoryId(catId);
                                const currentType = eventTypes.find((t) => t.id === selectedEvent?.type_id);
                                if (!currentType || currentType.parent_id !== catId) {
                                  void handleFieldChange("type_id", undefined);
                                }
                              }}
                              disabled={!selectedEvent.theme_id}
                            >
                              <SelectTrigger className="bg-background border-border z-50" id="eventCategory">
                                <SelectValue
                                  placeholder={
                                    selectedEvent.theme_id ? "Select event category" : "Select theme first"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-border shadow-lg z-50">
                                {eventTypes
                                  .filter((t) => !t.parent_id)
                                  .map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                      {sportThemeRootCategoryDisplayLabel(selectedThemeName, cat.name)}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="eventType">Event Type</Label>
                            <Select
                              value={selectedEvent.type_id?.toString() || ""}
                              onValueChange={(value) => handleFieldChange("type_id", parseInt(value, 10))}
                              disabled={!selectedCategoryId}
                            >
                              <SelectTrigger className="bg-background border-border z-50" id="eventType">
                                <SelectValue
                                  placeholder={
                                    selectedCategoryId ? "Select event type" : "Select category first"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-border shadow-lg z-50">
                                {(() => {
                                  const children = eventTypes.filter(
                                    (t) => t.parent_id === selectedCategoryId,
                                  );
                                  if (children.length === 0 && selectedCategoryId) {
                                    const cat = eventTypes.find((t) => t.id === selectedCategoryId);
                                    return cat ? (
                                      <SelectItem key={cat.id} value={cat.id.toString()}>
                                        {cat.name}
                                      </SelectItem>
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
                        </>
                      )}

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

                      <div className="md:col-span-2 space-y-2 border rounded-md p-3 bg-muted/30">
                        <Label>Entertainment profiles (optional)</Label>
                        <p className="text-xs text-muted-foreground">Select one or more. Filter by type to narrow the list.</p>
                        <Select
                          value={selectedEntTypeFilter === null ? "__all__" : String(selectedEntTypeFilter)}
                          onValueChange={(v) =>
                            setSelectedEntTypeFilter(v === "__all__" ? null : Number(v))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All entertainment types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__">All types</SelectItem>
                            {entertainmentTypes.map((t) => (
                              <SelectItem key={t.id} value={t.id.toString()}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="max-h-36 overflow-y-auto space-y-2">
                          {entertainmentOptions
                            .filter(
                              (o) =>
                                selectedEntTypeFilter == null || o.ent_type_id === selectedEntTypeFilter
                            )
                            .map((o) => (
                              <label key={o.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={selectedEntIds.includes(o.id)}
                                  onCheckedChange={(c) =>
                                    toggleEntertainmentId(o.id, c === true)
                                  }
                                />
                                <span>{o.business_name}</span>
                              </label>
                            ))}
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-2 border rounded-md p-3 bg-muted/30">
                        <Label>External vendor (optional)</Label>
                        <p className="text-xs text-muted-foreground">
                          Procurement vendors from External Vendors in the sidebar (not equipment rentals). Select one or more.
                        </p>
                        <Select
                          value={selectedSupplierCategoryFilter === null ? "__all__" : String(selectedSupplierCategoryFilter)}
                          onValueChange={(v) =>
                            setSelectedSupplierCategoryFilter(v === "__all__" ? null : Number(v))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__">All categories</SelectItem>
                            {supplierCategories.map((t) => (
                              <SelectItem key={t.id} value={t.id.toString()}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="max-h-36 overflow-y-auto space-y-2">
                          {supplierOptions
                            .filter(
                              (o) =>
                                selectedSupplierCategoryFilter == null ||
                                o.category_id === selectedSupplierCategoryFilter
                            )
                            .map((o) => (
                              <label key={o.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={selectedSvcIds.includes(o.id)}
                                  onCheckedChange={(c) =>
                                    toggleServiceVendorId(o.id, c === true)
                                  }
                                />
                                <span>{o.business_name}</span>
                              </label>
                            ))}
                        </div>
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
                    <CardTitle>Event Timeline &amp; task assignment</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <TimelineView eventId={selectedEvent.id} refreshKey={resourceRefreshKey} />
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" asChild>
                        <Link to={`/dashboard/task-timeline?eventId=${selectedEvent.id}`}>
                          Open full Event Timeline
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/dashboard/project-management?eventId=${selectedEvent.id}&openModal=true`
                          )
                        }
                      >
                        Add task assignment
                      </Button>
                    </div>
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">Tasks for this event</h3>
                      <TaskManager eventId={selectedEvent.id} embedInManageEvent />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="change-request" className="space-y-6">
                <Card className="shadow-elegant border-0 bg-gradient-subtle">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle>Create change request</CardTitle>
                    <p className="text-sm text-muted-foreground font-normal mt-1">
                      Submissions create a task and an open change request for this event (same queue as Project
                      Management → Task and → Change Management). Coordinators are notified.
                    </p>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" onClick={() => setNewRequestDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Open change request form
                      </Button>
                      <Button type="button" variant="outline" asChild>
                        <Link to={`/dashboard/project-management?eventId=${selectedEvent.id}`}>
                          Open Project Management
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-elegant border-0 bg-gradient-subtle">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle>Review &amp; approve change requests</CardTitle>
                    <p className="text-sm text-muted-foreground font-normal mt-1">
                      Open requests from collaborators or from this page. Approve applies supported field updates to
                      the linked task or event; reject closes the request.
                    </p>
                  </CardHeader>
                  <CardContent className="p-6">
                    <EventChangeRequestsList
                      eventId={selectedEvent.id}
                      refreshToken={changeRequestRefreshKey}
                      compact
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <Analytics
                  eventId={selectedEvent.id}
                  showEventScopePicker
                  onInteractionTrack={(interaction) => {
                    console.log("User interaction tracked:", interaction);
                  }}
                />
                <Card className="shadow-elegant border-0 bg-gradient-subtle">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle>Add task assignment</CardTitle>
                    <p className="text-sm text-muted-foreground font-normal mt-1">
                      Same task form as Project Management → Task. Open here or add tasks from the Timeline tab.
                    </p>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/dashboard/project-management?eventId=${selectedEvent.id}&openModal=true`,
                          )
                        }
                      >
                        Open Add Task in Project Management
                      </Button>
                      <Button type="button" variant="outline" asChild>
                        <Link to={`/dashboard/project-management?eventId=${selectedEvent.id}`}>
                          Project Management
                        </Link>
                      </Button>
                    </div>
                    <TaskManager eventId={selectedEvent.id} embedInManageEvent />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="changelog">
                <Card className="shadow-elegant border-0 bg-gradient-subtle">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle>Change History</CardTitle>
                    <p className="text-sm text-muted-foreground font-normal">
                      A running record of edits to this event and notable workspace actions. Saving details here updates the
                      event; task work and change approvals stay in{" "}
                      <span className="font-medium text-foreground">Project Management</span> (Task / Change Management
                      tabs) and on this page under <span className="font-medium text-foreground">Change requests</span>.
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto">
                      {unifiedChangelog.length > 0 ? (
                        unifiedChangelog.map((entry) =>
                          entry.source === "cm_change_logs" ? (
                            <div
                              key={entry.id}
                              className="p-4 border-b border-border/30"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <Badge variant="secondary" className="text-[10px]">
                                      Field change
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {entry.log.action}
                                    </Badge>
                                    {entry.log.field_name && (
                                      <span className="text-xs text-muted-foreground">
                                        {entry.log.field_name}
                                      </span>
                                    )}
                                  </div>
                                  {entry.log.change_description && (
                                    <p className="text-sm text-foreground mb-2">
                                      {entry.log.change_description}
                                    </p>
                                  )}
                                  {entry.log.old_value && entry.log.new_value && (
                                    <div className="text-xs space-y-1">
                                      <div className="text-red-600">
                                        Old: {entry.log.old_value}
                                      </div>
                                      <div className="text-green-600">
                                        New: {entry.log.new_value}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground text-right shrink-0">
                                  {format(
                                    new Date(entry.created_at),
                                    "MMM dd, yyyy HH:mm"
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div
                              key={entry.id}
                              className="p-4 border-b border-border/30"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <Badge variant="secondary" className="text-[10px]">
                                      Activity
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {entry.activity.action}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {entry.activity.entity_type}
                                    </span>
                                  </div>
                                  {entry.activity.metadata &&
                                    Object.keys(entry.activity.metadata).length >
                                      0 && (
                                      <pre className="text-xs bg-muted/50 rounded p-2 mt-2 overflow-x-auto max-h-24 whitespace-pre-wrap break-words">
                                        {JSON.stringify(
                                          entry.activity.metadata,
                                          null,
                                          2
                                        )}
                                      </pre>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground text-right shrink-0">
                                  {format(
                                    new Date(entry.created_at),
                                    "MMM dd, yyyy HH:mm"
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        )
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
    {showBackToTop ? (
      <Button
        type="button"
        size="icon"
        className="fixed bottom-6 right-6 z-50 shadow-lg"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        title="Back to top"
      >
        <ChevronUp className="h-5 w-5" />
      </Button>
    ) : null}
    </>
  );
};

export default ManageEvent;
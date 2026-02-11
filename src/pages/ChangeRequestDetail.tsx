import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/lib/permissions";
import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Play,
  X,
  Edit,
  Save,
  Calendar,
  User,
  FileText,
  History,
  AlertCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ChangeRequest {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  event_id: string | null;
  task_id: string | null;
  requested_by: string | null;
  approved_by: string | null;
  applied_by: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  applied_at: string | null;
  rejection_reason: string | null;
  change_type: string | null;
  field_changes?: Record<string, { oldValue: any; newValue: any }> | null;
  event_name?: string;
  task_title?: string;
  requester_name?: string;
}

interface FieldChange {
  fieldName: string;
  oldValue: any;
  newValue: any;
  displayName: string;
}

interface ChangeLog {
  id: string;
  action: string;
  change_description: string | null;
  changed_by: string;
  created_at: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
}

const ChangeRequestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRoles, loading: authLoading } = useAuth();
  const { isAdmin, isCoordinator, permissionLevel, loading: permissionsLoading } = usePermissions();
  const [changeRequest, setChangeRequest] = useState<ChangeRequest | null>(null);
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<string>("");
  const [isEditingFields, setIsEditingFields] = useState(false);
  const [editedFieldChanges, setEditedFieldChanges] = useState<Record<string, { oldValue: any; newValue: any }>>({});
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: "approve" | "reject" | "apply" | "cancel" | null;
    rejectionReason?: string;
  }>({ open: false, action: null });
  const [rejectionReason, setRejectionReason] = useState("");
  const [userDisplayNames, setUserDisplayNames] = useState<Record<string, string>>({});
  const [hostPermissionLevel, setHostPermissionLevel] = useState<'admin' | 'coordinator' | 'viewer' | null>(null);
  const [hostPermissionLoading, setHostPermissionLoading] = useState(true);
  const [eventThemes, setEventThemes] = useState<Array<{ id: number; name: string; premium: boolean }>>([]);
  const [eventTypes, setEventTypes] = useState<Array<{ id: number; name: string; theme_id: number }>>([]);
  const [eventData, setEventData] = useState<{
    id: string;
    title: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    theme_id?: number;
    type_id?: number;
    status?: string;
    budget?: number;
    venue?: string;
  } | null>(null);
  const [eventLoading, setEventLoading] = useState(false);

  // Fetch the permission level specifically for the host role
  useEffect(() => {
    const fetchHostPermissionLevel = async () => {
      setHostPermissionLoading(true);
      
      if (!user) {
        setHostPermissionLevel(null);
        setHostPermissionLoading(false);
        return;
      }

      if (!userRoles.includes('host')) {
        // User doesn't have host role
        setHostPermissionLevel(null);
        setHostPermissionLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('permission_level')
          .eq('user_id', user.id)
          .eq('role', 'host')
          .single();

        if (error) {
          console.error('Error fetching host permission level:', error);
          setHostPermissionLevel(null);
        } else {
          setHostPermissionLevel(data?.permission_level as 'admin' | 'coordinator' | 'viewer' | null);
        }
      } catch (error) {
        console.error('Error fetching host permission level:', error);
        setHostPermissionLevel(null);
      } finally {
        setHostPermissionLoading(false);
      }
    };

    if (user && userRoles.length > 0) {
      fetchHostPermissionLevel();
    } else if (user && userRoles.length === 0) {
      // Roles loaded but user has no roles
      setHostPermissionLevel(null);
      setHostPermissionLoading(false);
    }
  }, [user, userRoles]);

  // Check if user has host role with admin or coordinator permission level
  const hasHostWithAdminOrCoordinator = useMemo(() => {
    const hasHostRole = userRoles.includes('host');
    const hasRequiredPermission = hostPermissionLevel === 'admin' || hostPermissionLevel === 'coordinator';
    return hasHostRole && hasRequiredPermission;
  }, [userRoles, hostPermissionLevel]);

  const hasAccess = useMemo(() => {
    return isAdmin() || hasHostWithAdminOrCoordinator;
  }, [isAdmin, hasHostWithAdminOrCoordinator]);

  useEffect(() => {
    // Wait for auth, permissions, and host permission to finish loading before checking access
    // If we have a user, also wait for userRoles to be populated (not empty during initial load)
    // The issue: authLoading can be false while userRoles is still being fetched (due to setTimeout in useAuth)
    // Also: if user has host role, wait for hostPermissionLevel to be fetched (not null)
    // Also: wait for permissionLevel to be set (not null) so isAdmin() works correctly
    const allLoadingComplete = !authLoading && !permissionsLoading && !hostPermissionLoading;
    // If user exists but userRoles is empty, we're still loading roles - wait
    const rolesReady = !user || userRoles.length > 0;
    // If user has host role, wait for hostPermissionLevel to be fetched
    const hostPermissionReady = !userRoles.includes('host') || hostPermissionLevel !== null;
    // Wait for permissionLevel to be set (needed for isAdmin() check)
    const permissionLevelReady = !user || permissionLevel !== null;
    // Additional safety: if we have a user but any critical data is missing, don't check yet
    const dataComplete = !user || (userRoles.length > 0 && permissionLevel !== null && (!userRoles.includes('host') || hostPermissionLevel !== null));
    
    if (allLoadingComplete && rolesReady && hostPermissionReady && permissionLevelReady && dataComplete) {
      if (!hasAccess) {
        toast({
          title: "Access Denied",
          description: "Only Host role with Admin or Coordinator permission level can access change requests",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, permissionsLoading, hostPermissionLoading, hasAccess, user, userRoles, hostPermissionLevel]);

  // Real-time subscriptions for change request and logs
  useEffect(() => {
    if (!id) return;

    // Subscribe to changes in this specific change request
    const changeRequestChannel = supabase
      .channel(`change-request-${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'change_requests',
        filter: `id=eq.${id}`
      }, (payload: any) => {
        console.log('Change request updated:', payload);
        fetchChangeRequest();
        fetchChangeLogs(); // Also refresh logs when status changes
      })
      .subscribe();

    // Subscribe to change logs for this change request's event
    const changeLogsChannel = supabase
      .channel(`change-logs-${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'change_logs'
        }, (payload: any) => {
          // Check if this log is related to our change request's event
          const entityId = payload.new?.entity_id || payload.old?.entity_id;
          if (changeRequest?.event_id && entityId && String(entityId) === String(changeRequest.event_id)) {
            console.log('Change log updated for event:', payload);
            fetchChangeLogs();
          }
        })
      .subscribe();

    return () => {
      supabase.removeChannel(changeRequestChannel);
      supabase.removeChannel(changeLogsChannel);
    };
  }, [id, changeRequest?.event_id]);

  useEffect(() => {
    fetchUserNames();
  }, [changeRequest, changeLogs]);

  const fetchUserNames = async () => {
    const userIds = new Set<string>();
    if (changeRequest?.requested_by) userIds.add(changeRequest.requested_by);
    if (changeRequest?.approved_by) userIds.add(changeRequest.approved_by);
    if (changeRequest?.applied_by) userIds.add(changeRequest.applied_by);
    changeLogs.forEach((log) => userIds.add(log.changed_by));

    if (userIds.size === 0) return;

    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", Array.from(userIds));

    const nameMap: Record<string, string> = {};
    (data || []).forEach((profile) => {
      nameMap[profile.user_id] = profile.display_name || profile.user_id.substring(0, 8) + "...";
    });
    setUserDisplayNames(nameMap);
  };

  const fetchChangeRequest = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("change_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Fetch related event and task names
      let eventName: string | undefined;
      let taskTitle: string | undefined;

      if (data.event_id) {
        // Check if event_id is a UUID (events table) or TEXT (Create Event table)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.event_id);
        
        if (isUUID) {
          // Query events table for UUID
          try {
            const { data: eventData } = await supabase
              .from("events")
              .select("title")
              .eq("id", data.event_id)
              .maybeSingle();
            
            if (eventData) {
              eventName = eventData.title || "Unknown Event";
            }
          } catch (err) {
            console.error("Error fetching event from events table:", err);
          }
        } else {
          // Query Create Event table for TEXT userid
          try {
            const { data: eventData } = await supabase
              .from("Create Event")
              .select("event_theme")
              .eq("userid", data.event_id)
              .maybeSingle();

            if (eventData) {
              eventName = Array.isArray(eventData.event_theme)
                ? eventData.event_theme.join(", ")
                : eventData.event_theme || "Unknown Event";
            }
          } catch (err) {
            console.error("Error fetching event from Create Event table:", err);
          }
        }
      }

      if (data.task_id) {
        const { data: taskData } = await supabase
          .from("tasks")
          .select("title")
          .eq("id", data.task_id)
          .single();

        if (taskData) {
          taskTitle = taskData.title;
        }
      }

      // Parse field_changes if it exists
      let parsedFieldChanges: Record<string, { oldValue: any; newValue: any }> | null = null;
      if (data.field_changes) {
        try {
          // field_changes is already JSONB, but might be stringified
          parsedFieldChanges = typeof data.field_changes === 'string' 
            ? JSON.parse(data.field_changes) 
            : data.field_changes;
        } catch (e) {
          console.error('Error parsing field_changes:', e);
        }
      }

      setChangeRequest({
        ...data,
        field_changes: parsedFieldChanges,
        event_name: eventName,
        task_title: taskTitle,
      });

      setEditTitle(data.title || "");
      setEditDescription(data.description || "");
      setEditPriority(data.priority || "");
      
      // Initialize edited field changes - will be updated when event data loads
      if (parsedFieldChanges) {
        setEditedFieldChanges(parsedFieldChanges);
      }
    } catch (error) {
      console.error("Error fetching change request:", error);
      toast({
        title: "Error",
        description: "Failed to fetch change request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  const fetchChangeLogs = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("cm_change_logs")
        .select("*")
        .eq("entity_type", "change_request")
        .eq("entity_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChangeLogs(data || []);
    } catch (error) {
      console.error("Error fetching change logs:", error);
    }
  }, [id]);

  // Fetch event data when event_id is available
  const fetchEventData = useCallback(async (eventId: string) => {
    if (!eventId) return;
    
    setEventLoading(true);
    try {
      // Check if event_id is a UUID (events table) or TEXT (Create Event table)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
      
      if (isUUID) {
        // Query events table for UUID
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();

        if (error) throw error;
        
        if (data) {
          setEventData({
            id: data.id,
            title: data.title,
            description: data.description,
            start_date: data.start_date,
            end_date: data.end_date,
            start_time: data.start_time,
            end_time: data.end_time,
            location: data.location,
            theme_id: data.theme_id ? Number(data.theme_id) : undefined,
            type_id: data.type_id ? Number(data.type_id) : undefined,
            status: data.status,
            budget: data.budget,
            venue: data.venue,
          });
          
          // Note: We don't fetch event types here because we already fetch all types on mount
          // This ensures all types are available for display and dropdowns, even when editing
          // field changes that reference types from different themes
        }
      } else {
        // Query Create Event table for TEXT userid
        const { data, error } = await supabase
          .from("Create Event")
          .select("*")
          .eq("userid", eventId)
          .single();

        if (error) throw error;
        
        if (data) {
          // Transform Create Event data to match events structure
          // Handle event_location which may be string or string[]
          const locationValue = Array.isArray(data.event_location) 
            ? data.event_location.join(", ") 
            : data.event_location || undefined;
          
          setEventData({
            id: data.userid,
            title: Array.isArray(data.event_theme) ? data.event_theme.join(", ") : data.event_theme || "Event",
            description: data.event_description,
            start_date: data.event_start_date,
            end_date: data.event_end_date,
            location: locationValue,
            theme_id: undefined,
            type_id: undefined,
            status: undefined,
            budget: undefined,
            venue: undefined,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching event data:", error);
    } finally {
      setEventLoading(false);
    }
  }, []);

  // Fetch themes and event types
  useEffect(() => {
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

    const fetchAllEventTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('event_types')
          .select('id, name, theme_id')
          .order('name');

        if (error) throw error;
        setEventTypes(data || []);
      } catch (error) {
        console.error('Error fetching event types:', error);
      }
    };

    fetchThemes();
    fetchAllEventTypes();
  }, []);

  // Fetch event data when change request is loaded
  useEffect(() => {
    if (changeRequest?.event_id) {
      fetchEventData(changeRequest.event_id);
    }
  }, [changeRequest?.event_id, fetchEventData]);

  // Update edited field changes with event data when it loads
  useEffect(() => {
    if (eventData && changeRequest?.field_changes) {
      // Update oldValue from event data for fields that exist in event
      const updatedFieldChanges: Record<string, { oldValue: any; newValue: any }> = {};
      
      for (const [fieldName, change] of Object.entries(changeRequest.field_changes)) {
        // Use event data value if available, otherwise use oldValue from field_changes
        const currentEventValue = eventData && fieldName in eventData
          ? (eventData as any)[fieldName]
          : change.oldValue;
        
        updatedFieldChanges[fieldName] = {
          oldValue: currentEventValue ?? null,
          newValue: change.newValue ?? null,
        };
      }
      
      setEditedFieldChanges(updatedFieldChanges);
    }
  }, [eventData, changeRequest?.field_changes]);

  // Fetch data when access is granted
  useEffect(() => {
    if (!permissionsLoading && hasAccess && id) {
      fetchChangeRequest();
      fetchChangeLogs();
    }
  }, [id, permissionsLoading, hasAccess, fetchChangeRequest, fetchChangeLogs]);

  const handleSave = async () => {
    if (!id || !changeRequest) return;

    try {
      setSaving(true);
      const updateData: any = {
        title: editTitle,
        // Description is not editable - do not include it in updates
        priority: editPriority,
      };

      // If field changes were edited, update them
      if (isEditingFields && Object.keys(editedFieldChanges).length > 0) {
        updateData.field_changes = editedFieldChanges;
      }

      const { error } = await supabase
        .from("change_requests")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Change request updated successfully",
      });

      setIsEditing(false);
      setIsEditingFields(false);
      fetchChangeRequest();
      fetchChangeLogs();
    } catch (error) {
      console.error("Error updating change request:", error);
      toast({
        title: "Error",
        description: "Failed to update change request",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFieldChanges = async () => {
    if (!id || !changeRequest) return;

    try {
      setSaving(true);
      
      // Validate and sanitize field changes
      const sanitizedFieldChanges: Record<string, { oldValue: any; newValue: any }> = {};
      // Exclude description - it should not be editable in field changes
      const allowedFields = ['title', 'start_date', 'end_date', 'start_time', 'end_time', 'location', 'venue', 'theme_id', 'type_id', 'status', 'budget'];
      
      for (const [field, change] of Object.entries(editedFieldChanges)) {
        // Security: Only allow known fields
        if (!allowedFields.includes(field)) {
          console.warn(`Skipping unauthorized field: ${field}`);
          continue;
        }
        
        // Validate structure
        if (!change || typeof change !== 'object') {
          console.warn(`Invalid change structure for field: ${field}`);
          continue;
        }
        
        // Sanitize values based on field type
        let sanitizedNewValue: any = change.newValue;
        let sanitizedOldValue: any = change.oldValue ?? null;
        
        // Type-specific sanitization
        if (field === 'budget' || field === 'theme_id' || field === 'type_id') {
          sanitizedNewValue = sanitizedNewValue === null || sanitizedNewValue === '' 
            ? null 
            : Number(sanitizedNewValue);
          if (isNaN(sanitizedNewValue as number)) {
            sanitizedNewValue = null;
          }
        } else if (field.includes('date')) {
          // Date validation
          if (sanitizedNewValue && typeof sanitizedNewValue === 'string') {
            const date = new Date(sanitizedNewValue);
            if (isNaN(date.getTime())) {
              sanitizedNewValue = null;
            }
          }
        } else if (typeof sanitizedNewValue === 'string') {
          // String sanitization: trim and limit length
          sanitizedNewValue = sanitizedNewValue.trim();
          if (sanitizedNewValue.length > 10000) {
            sanitizedNewValue = sanitizedNewValue.substring(0, 10000);
          }
        }
        
        sanitizedFieldChanges[field] = {
          oldValue: sanitizedOldValue,
          newValue: sanitizedNewValue
        };
      }

      // Ensure we have at least one valid field change
      if (Object.keys(sanitizedFieldChanges).length === 0) {
        toast({
          title: "Error",
          description: "No valid field changes to save",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("change_requests")
        .update({
          field_changes: sanitizedFieldChanges,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Field changes updated successfully",
      });

      setIsEditingFields(false);
      fetchChangeRequest();
      fetchChangeLogs();
    } catch (error) {
      console.error("Error updating field changes:", error);
      toast({
        title: "Error",
        description: "Failed to update field changes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getFieldDisplayName = (fieldName: string): string => {
    const fieldMap: Record<string, string> = {
      title: "Title",
      description: "Description",
      start_date: "Start Date",
      end_date: "End Date",
      start_time: "Start Time",
      end_time: "End Time",
      location: "Location",
      venue: "Venue",
      theme_id: "Theme",
      type_id: "Event Type",
      status: "Status",
      budget: "Budget",
    };
    return fieldMap[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getFieldInputType = (fieldName: string): 'text' | 'date' | 'time' | 'number' | 'select' | 'textarea' => {
    if (fieldName.includes('date')) return 'date';
    if (fieldName.includes('time')) return 'time';
    if (fieldName === 'budget') return 'number';
    if (fieldName === 'status') return 'select';
    if (fieldName === 'theme_id') return 'select';
    if (fieldName === 'type_id') return 'select';
    if (fieldName === 'description') return 'textarea';
    return 'text';
  };

  const getFieldSelectOptions = (fieldName: string): Array<{ value: string; label: string }> => {
    if (fieldName === 'status') {
      return [
        { value: 'pending', label: 'Pending' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ];
    }
    if (fieldName === 'theme_id') {
      return eventThemes.map(theme => ({
        value: theme.id.toString(),
        label: theme.name,
      }));
    }
    if (fieldName === 'type_id') {
      // Get the selected theme_id from the edited field changes, original field changes, or event data
      const themeId = editedFieldChanges.theme_id?.newValue ?? 
                     changeRequest?.field_changes?.theme_id?.newValue ??
                     changeRequest?.field_changes?.theme_id?.oldValue ??
                     eventData?.theme_id;
      // Get the current type_id value to ensure it's always included in options
      const currentTypeId = editedFieldChanges.type_id?.newValue ?? 
                           changeRequest?.field_changes?.type_id?.newValue ??
                           changeRequest?.field_changes?.type_id?.oldValue ??
                           eventData?.type_id;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7ba7f6db-4491-4548-a2a1-1710bced117d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChangeRequestDetail.tsx:765',message:'getFieldSelectOptions type_id',data:{themeId,currentTypeId,eventTypesCount:eventTypes.length,hasEditedThemeId:!!editedFieldChanges.theme_id?.newValue,hasFieldChangesThemeId:!!changeRequest?.field_changes?.theme_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // If no theme_id, return all types (for initial display)
      if (!themeId && eventTypes.length > 0) {
        return eventTypes.map(type => ({
          value: type.id.toString(),
          label: type.name,
        }));
      }
      // Filter types by theme_id
      const filteredTypes = themeId 
        ? eventTypes.filter(type => type.theme_id === Number(themeId))
        : [];
      
      // Always include the current type_id value if it exists and isn't already in the filtered list
      // This ensures the dropdown can display the current value even if it's from a different theme
      const typeIdSet = new Set(filteredTypes.map(t => t.id));
      if (currentTypeId && !typeIdSet.has(Number(currentTypeId))) {
        const currentType = eventTypes.find(t => t.id === Number(currentTypeId));
        if (currentType) {
          filteredTypes.push(currentType);
        }
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7ba7f6db-4491-4548-a2a1-1710bced117d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChangeRequestDetail.tsx:785',message:'Filtered types result',data:{filteredCount:filteredTypes.length,currentTypeId,currentTypeIncluded:currentTypeId?filteredTypes.some(t=>t.id===Number(currentTypeId)):false,filteredTypes:filteredTypes.map(t=>({id:t.id,name:t.name}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return filteredTypes.map(type => ({
        value: type.id.toString(),
        label: type.name,
      }));
    }
    return [];
  };

  const getFieldDisplayValue = (fieldName: string, value: any): string => {
    if (value === null || value === '' || value === undefined) return '(empty)';
    
    if (fieldName === 'status') {
      const statusMap: Record<string, string> = {
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'completed': 'Completed',
        'cancelled': 'Cancelled',
      };
      return statusMap[value] || value;
    }
    
    if (fieldName === 'theme_id') {
      const theme = eventThemes.find(t => t.id === Number(value));
      return theme ? theme.name : String(value);
    }
    
    if (fieldName === 'type_id') {
      // Use all event types (not filtered) for display lookup
      const type = eventTypes.find(t => t.id === Number(value));
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7ba7f6db-4491-4548-a2a1-1710bced117d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChangeRequestDetail.tsx:815',message:'getFieldDisplayValue type_id',data:{value,valueType:typeof value,eventTypesCount:eventTypes.length,typeFound:!!type,typeName:type?.name,allTypeIds:eventTypes.map(t=>t.id).slice(0,10)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // If type not found and eventTypes are loaded, it means the type doesn't exist - show ID with a note
      // If eventTypes not loaded yet, show "Loading..." temporarily
      if (eventTypes.length === 0) {
        return 'Loading...';
      }
      return type ? type.name : `ID: ${value}`;
    }
    
    if (fieldName.includes('date') && value) {
      try {
        return format(new Date(value), 'PPP');
      } catch {
        return String(value);
      }
    }
    
    if (fieldName === 'budget' && value) {
      return `$${Number(value).toLocaleString()}`;
    }
    
    return String(value);
  };

  const parseFieldChanges = (): FieldChange[] => {
    if (!changeRequest?.field_changes) return [];
    
    return Object.entries(changeRequest.field_changes).map(([fieldName, change]) => ({
      fieldName,
      oldValue: change.oldValue,
      newValue: change.newValue,
      displayName: getFieldDisplayName(fieldName),
    }));
  };

  const handleAction = async (action: "approve" | "reject" | "apply" | "cancel") => {
    if (!id) return;

    try {
      setSaving(true);
      let rpcFunction: "approve_change_request" | "reject_change_request" | "apply_change_request" | "cancel_change_request";
      let successMessage: string;
      let rpcParams: any = {};

      switch (action) {
        case "approve":
          rpcFunction = "approve_change_request";
          successMessage = "Change request approved";
          rpcParams = { p_change_request_id: id };
          break;
        case "reject":
          rpcFunction = "reject_change_request";
          successMessage = "Change request rejected";
          rpcParams = {
            p_change_request_id: id,
            p_rejection_reason: rejectionReason || "No reason provided",
          };
          break;
        case "apply":
          rpcFunction = "apply_change_request";
          successMessage = "Change request applied";
          rpcParams = { p_change_request_id: id };
          break;
        case "cancel":
          rpcFunction = "cancel_change_request";
          successMessage = "Change request cancelled";
          rpcParams = { p_change_request_id: id };
          break;
        default:
          throw new Error("Invalid action");
      }

      const { data, error } = await supabase.rpc(rpcFunction, rpcParams);

      if (error) throw error;

      toast({
        title: "Success",
        description: successMessage,
      });

      setActionDialog({ open: false, action: null });
      setRejectionReason("");
      fetchChangeRequest();
      fetchChangeLogs();
    } catch (error: any) {
      console.error("Error performing action:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to perform action",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "applied":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Applied</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "high":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">High</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Medium</Badge>;
      case "low":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Low</Badge>;
      default:
        return priority ? <Badge variant="outline">{priority}</Badge> : null;
    }
  };

  const canEdit = changeRequest?.status === "pending" && changeRequest?.requested_by === user?.id;
  const canApprove = changeRequest?.status === "pending";
  const canReject = changeRequest?.status === "pending";
  const canApply = changeRequest?.status === "approved";
  const canCancel = changeRequest?.status !== "applied" && changeRequest?.status !== "cancelled";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading change request...</p>
        </div>
      </div>
    );
  }

  if (!changeRequest) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Change request not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard/change-requests")}>
          Back to Change Requests
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/change-requests")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Change Request Details</h1>
            <p className="text-muted-foreground">View and manage change request</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(changeRequest.status)}
          {getPriorityBadge(changeRequest.priority)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Details
                </CardTitle>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (isEditing) {
                        handleSave();
                      } else {
                        setIsEditing(true);
                      }
                    }}
                    disabled={saving}
                  >
                    {isEditing ? (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing && canEdit ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Change request title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={6}
                      placeholder="Describe the change request..."
                      disabled
                      className="bg-muted cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={editPriority} onValueChange={setEditPriority}>
                      <SelectTrigger id="priority">
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
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Title</Label>
                    <p className="text-base font-medium">{changeRequest.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Description</Label>
                    <p className="text-sm whitespace-pre-wrap">
                      {changeRequest.description || "No description provided"}
                    </p>
                  </div>
                  {changeRequest.priority && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Priority</Label>
                      <div className="mt-1">{getPriorityBadge(changeRequest.priority)}</div>
                    </div>
                  )}
                  {changeRequest.rejection_reason && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Rejection Reason</Label>
                      <p className="text-sm text-destructive">{changeRequest.rejection_reason}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Field Changes Section */}
          {changeRequest.field_changes && Object.keys(changeRequest.field_changes).length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Field Changes
                  </CardTitle>
                  {canApprove && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (isEditingFields) {
                          handleSaveFieldChanges();
                        } else {
                          setIsEditingFields(true);
                        }
                      }}
                      disabled={saving}
                    >
                      {isEditingFields ? (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Fields
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <CardDescription>
                  Review and modify the proposed field changes before approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {parseFieldChanges()
                    .filter(fc => fc.fieldName !== 'description') // Exclude description from field changes
                    .map((fieldChange) => {
                      const inputType = getFieldInputType(fieldChange.fieldName);
                      
                      // Get current value from event data if available, otherwise use oldValue from field changes
                      const currentEventValue = eventData && fieldChange.fieldName in eventData
                        ? (eventData as any)[fieldChange.fieldName]
                        : fieldChange.oldValue;
                      
                      // Get the new value being edited (from editedFieldChanges or original newValue)
                      const newValue = editedFieldChanges[fieldChange.fieldName]?.newValue ?? fieldChange.newValue;
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/7ba7f6db-4491-4548-a2a1-1710bced117d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChangeRequestDetail.tsx:1129',message:'Field change render',data:{fieldName:fieldChange.fieldName,inputType,newValue,newValueType:typeof newValue,currentEventValue,hasEventData:!!eventData,selectValue:newValue?.toString()??''},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                      // #endregion
                      
                      return (
                        <div key={fieldChange.fieldName} className="border rounded-lg p-4 space-y-2">
                          <Label className="text-sm font-semibold">{fieldChange.displayName}</Label>
                          {isEditingFields && canApprove ? (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-muted-foreground">Current Value</Label>
                                <div className="mt-1 p-2 bg-muted rounded text-sm">
                                  {getFieldDisplayValue(fieldChange.fieldName, currentEventValue)}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">New Value</Label>
                                {inputType === 'select' ? (
                                  <Select
                                    value={newValue !== null && newValue !== undefined ? String(newValue) : ''}
                                    disabled={fieldChange.fieldName === 'type_id' && !editedFieldChanges.theme_id?.newValue && !eventData?.theme_id}
                                    onValueChange={(value) => {
                                      // #region agent log
                                      fetch('http://127.0.0.1:7242/ingest/7ba7f6db-4491-4548-a2a1-1710bced117d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChangeRequestDetail.tsx:1149',message:'Dropdown onValueChange',data:{fieldName:fieldChange.fieldName,value,currentNewValue:newValue,currentNewValueType:typeof newValue},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                                      // #endregion
                                      const finalValue = fieldChange.fieldName === 'theme_id' || fieldChange.fieldName === 'type_id'
                                        ? Number(value)
                                        : value;
                                      // #region agent log
                                      fetch('http://127.0.0.1:7242/ingest/7ba7f6db-4491-4548-a2a1-1710bced117d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChangeRequestDetail.tsx:1153',message:'Setting editedFieldChanges',data:{fieldName:fieldChange.fieldName,finalValue,finalValueType:typeof finalValue,oldValue:fieldChange.oldValue},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                                      // #endregion
                                      setEditedFieldChanges(prev => ({
                                        ...prev,
                                        [fieldChange.fieldName]: {
                                          ...prev[fieldChange.fieldName],
                                          oldValue: fieldChange.oldValue,
                                          newValue: finalValue,
                                        }
                                      }));
                                      
                                      // If theme_id changes, reset type_id and fetch event types for new theme
                                      if (fieldChange.fieldName === 'theme_id') {
                                        setEditedFieldChanges(prev => {
                                          const updated = { ...prev };
                                          if (updated.type_id) {
                                            updated.type_id = {
                                              ...updated.type_id,
                                              newValue: undefined,
                                            };
                                          }
                                          return updated;
                                        });
                                        
                                        // Fetch event types for the new theme
                                        if (value) {
                                          supabase
                                            .from('event_types')
                                            .select('id, name, theme_id')
                                            .eq('theme_id', Number(value))
                                            .order('name')
                                            .then(({ data, error }) => {
                                              if (!error && data) {
                                                // Merge with existing types to keep all available
                                                setEventTypes(prev => {
                                                  const merged = [...prev];
                                                  data.forEach(newType => {
                                                    if (!merged.find(t => t.id === newType.id)) {
                                                      merged.push(newType);
                                                    }
                                                  });
                                                  return merged;
                                                });
                                              }
                                            });
                                        }
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue 
                                        placeholder={
                                          fieldChange.fieldName === 'type_id' && !editedFieldChanges.theme_id?.newValue && !eventData?.theme_id
                                            ? "Select theme first"
                                            : "Select..."
                                        } 
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(() => {
                                        const options = getFieldSelectOptions(fieldChange.fieldName);
                                        const currentValueStr = newValue !== null && newValue !== undefined ? String(newValue) : '';
                                        const valueInOptions = options.some(opt => opt.value === currentValueStr);
                                        // #region agent log
                                        fetch('http://127.0.0.1:7242/ingest/7ba7f6db-4491-4548-a2a1-1710bced117d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChangeRequestDetail.tsx:1236',message:'Select options',data:{fieldName:fieldChange.fieldName,optionsCount:options.length,currentValueStr,valueInOptions,options:options.slice(0,5)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                                        // #endregion
                                        return options.map(option => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        ));
                                      })()}
                                    </SelectContent>
                                  </Select>
                                ) : inputType === 'textarea' ? (
                                  <Textarea
                                    value={newValue ?? ''}
                                    onChange={(e) => {
                                      setEditedFieldChanges(prev => ({
                                        ...prev,
                                        [fieldChange.fieldName]: {
                                          ...prev[fieldChange.fieldName],
                                          oldValue: fieldChange.oldValue,
                                          newValue: e.target.value,
                                        }
                                      }));
                                    }}
                                    className="mt-1"
                                    rows={3}
                                  />
                                ) : (
                                  <Input
                                    type={inputType}
                                    value={newValue ?? ''}
                                    onChange={(e) => {
                                      const value = inputType === 'number' 
                                        ? (e.target.value === '' ? null : Number(e.target.value))
                                        : e.target.value;
                                      setEditedFieldChanges(prev => ({
                                        ...prev,
                                        [fieldChange.fieldName]: {
                                          ...prev[fieldChange.fieldName],
                                          oldValue: fieldChange.oldValue,
                                          newValue: value,
                                        }
                                      }));
                                    }}
                                    className="mt-1"
                                  />
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-muted-foreground">Current Value</Label>
                                <div className="mt-1 p-2 bg-muted rounded text-sm">
                                  {getFieldDisplayValue(fieldChange.fieldName, currentEventValue)}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">New Value</Label>
                                <div className="mt-1 p-2 bg-green-50 dark:bg-green-950/20 rounded text-sm border border-green-200 dark:border-green-800">
                                  {getFieldDisplayValue(fieldChange.fieldName, fieldChange.newValue)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Information */}
          <Card>
            <CardHeader>
              <CardTitle>Related Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {changeRequest.event_id && (
                <div>
                  <Label className="text-sm text-muted-foreground">Event</Label>
                  <p className="text-sm font-medium">
                    {changeRequest.event_name || "Unknown Event"}
                  </p>
                </div>
              )}
              {changeRequest.task_id && (
                <div>
                  <Label className="text-sm text-muted-foreground">Task</Label>
                  <p className="text-sm font-medium">
                    {changeRequest.task_title || "Unknown Task"}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-sm text-muted-foreground">Requested By</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {changeRequest.requested_by
                      ? userDisplayNames[changeRequest.requested_by] ||
                        changeRequest.requested_by.substring(0, 8) + "..."
                      : "Unknown"}
                  </p>
                </div>
              </div>
              {changeRequest.approved_by && (
                <div>
                  <Label className="text-sm text-muted-foreground">Approved By</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {userDisplayNames[changeRequest.approved_by] ||
                        changeRequest.approved_by.substring(0, 8) + "..."}
                    </p>
                    {changeRequest.approved_at && (
                      <span className="text-xs text-muted-foreground">
                        ({format(new Date(changeRequest.approved_at), "MMM dd, yyyy")})
                      </span>
                    )}
                  </div>
                </div>
              )}
              {changeRequest.applied_by && (
                <div>
                  <Label className="text-sm text-muted-foreground">Applied By</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {userDisplayNames[changeRequest.applied_by] ||
                        changeRequest.applied_by.substring(0, 8) + "..."}
                    </p>
                    {changeRequest.applied_at && (
                      <span className="text-xs text-muted-foreground">
                        ({format(new Date(changeRequest.applied_at), "MMM dd, yyyy")})
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div>
                <Label className="text-sm text-muted-foreground">Created</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {format(new Date(changeRequest.created_at), "PPpp")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Change Log
              </CardTitle>
              <CardDescription>History of all changes to this request</CardDescription>
            </CardHeader>
            <CardContent>
              {changeLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No change log entries</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {changeLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {format(new Date(log.created_at), "MMM dd, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.action}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {userDisplayNames[log.changed_by] || log.changed_by.substring(0, 8) + "..."}
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.change_description || log.field_name || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canApprove && (
                <Button
                  className="w-full"
                  onClick={() => setActionDialog({ open: true, action: "approve" })}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              )}
              {canReject && (
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={() => setActionDialog({ open: true, action: "reject" })}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              )}
              {canApply && (
                <Button
                  className="w-full"
                  variant="default"
                  onClick={() => setActionDialog({ open: true, action: "apply" })}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Apply
                </Button>
              )}
              {canCancel && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setActionDialog({ open: true, action: "cancel" })}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
              {!canApprove && !canReject && !canApply && !canCancel && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No actions available for this status
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => {
        setActionDialog({ open, action: null });
        setRejectionReason("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === "approve" && "Approve Change Request"}
              {actionDialog.action === "reject" && "Reject Change Request"}
              {actionDialog.action === "apply" && "Apply Change Request"}
              {actionDialog.action === "cancel" && "Cancel Change Request"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === "approve" &&
                "Are you sure you want to approve this change request? It will be ready to apply."}
              {actionDialog.action === "reject" &&
                "Are you sure you want to reject this change request? Please provide a reason."}
              {actionDialog.action === "apply" &&
                "Are you sure you want to apply this change request? This action cannot be undone."}
              {actionDialog.action === "cancel" &&
                "Are you sure you want to cancel this change request? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          {actionDialog.action === "reject" && (
            <div className="py-4">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                rows={3}
                className="mt-2"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setActionDialog({ open: false, action: null });
              setRejectionReason("");
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => actionDialog.action && handleAction(actionDialog.action)}
              disabled={saving || (actionDialog.action === "reject" && !rejectionReason.trim())}
            >
              {saving ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChangeRequestDetail;

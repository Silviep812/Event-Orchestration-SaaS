import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/lib/permissions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Package,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Filter,
  RotateCcw,
  Truck,
  Utensils,
  Music,
  Palette,
  Settings,
  Pencil,
  Trash2,
  Shield,
  Link as LinkIcon,
  DollarSign,
  Star,
} from "lucide-react";

interface ResourceCategory {
  id: number;
  name: string;
}

interface ResourceStatus {
  id: number;
  name: string;
}

interface Resource {
  id: string;
  name: string;
  category_id: number;
  category_name?: string;
  status_id: number;
  status_name?: string;
  location: string;
  allocated: number;
  total: number;
  event_id?: string;
  utilization_percent?: number;
  available_count?: number;
  // Enrichment from profile tables
  profile_source?: 'venue' | 'hospitality' | 'service_rental' | 'local';
  profile_id?: string;
  profile_cost?: number;
  profile_rating?: number;
  profile_city?: string;
  profile_state?: string;
  profile_capacity?: number;
  profile_contact?: string;
  profile_email?: string;
  // Availability logic
  is_task_linked?: boolean;
  is_venue_booked?: boolean;
  computed_availability?: 'Available' | 'Unavailable' | 'Shortage';
}

interface ResourceManagerProps {
  eventId?: string;
  eventLocation?: string;
  refreshKey?: number;
}

// Status enum map for fast lookups (Option Sets pattern)
const STATUS_MAP: Record<number, string> = {
  1: 'Available',
  2: 'Shortage',
  3: 'Critical',
  4: 'Unavailable',
};

const CATEGORY_MAP: Record<number, string> = {};

const ResourceManager = ({ eventId, eventLocation, refreshKey }: ResourceManagerProps) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [statuses, setStatuses] = useState<ResourceStatus[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const activeElementRef = useRef<HTMLElement | null>(null);
  const [groupBy, setGroupBy] = useState<'location' | 'category'>('location');
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editResource, setEditResource] = useState<Resource | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [newResource, setNewResource] = useState({
    name: '',
    category_id: '',
    status_id: '',
    location: eventLocation || '',
    allocated: 0,
    total: 0,
    event_id: eventId || '',
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin, isCoordinator, isViewer, hasMinPermission } = usePermissions();

  // Role-based permission checks (memoized)
  const canCreate = useMemo(() => hasMinPermission('coordinator'), [hasMinPermission]);
  const canEdit = useMemo(() => hasMinPermission('coordinator'), [hasMinPermission]);
  const canDelete = useMemo(() => isAdmin(), [isAdmin]);
  const isReadOnly = useMemo(() => isViewer(), [isViewer]);

  // Update newResource location when eventLocation changes
  useEffect(() => {
    setNewResource(prev => ({
      ...prev,
      location: eventLocation || prev.location,
    }));
  }, [eventLocation]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  );

  // Fetch all data and enrich resources with profile data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Parallel fetch: categories, statuses, resources, profile tables, task assignments
      const [
        categoriesRes,
        statusesRes,
        resourcesRes,
        venueProfilesRes,
        hospProfilesRes,
        servVendorRes,
        taskAssignmentsRes,
        venueBookingsRes,
      ] = await Promise.all([
        supabase.from('resource_categories').select('*').order('name'),
        supabase.from('resource_status').select('*').order('name'),
        supabase.from('resources').select(`
          *,
          category:resource_categories!category_id(name),
          status:resource_status!status_id(name)
        `).eq(eventId ? 'event_id' : 'id', eventId || '').order('name'),
        supabase.from('venue_profiles').select('id, business_name, city, state, rating, capacity, cost, contact_name, email'),
        supabase.from('hospitality_profiles').select('id, business_name, city, state, rating, capacity, cost, contact_name, email'),
        supabase.from('serv_vendor_suppliers').select('id, business_name, city, state, rating, price, contact_name, email'),
        // Check which resources are linked to tasks
        eventId
          ? supabase.from('tasks').select('id, resource_assignments').eq('event_id', eventId).not('resource_assignments', 'is', null)
          : Promise.resolve({ data: [], error: null }),
        // Check confirmed venue bookings
        eventId
          ? supabase.from('reservation_submissions').select('event_id').eq('event_id', eventId)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (statusesRes.error) throw statusesRes.error;

      setCategories(categoriesRes.data || []);
      setStatuses(statusesRes.data || []);

      // Build category map for fast lookups
      (categoriesRes.data || []).forEach(c => { CATEGORY_MAP[c.id] = c.name; });

      // Build profile lookup maps for enrichment
      const venueMap = new Map<string, any>();
      (venueProfilesRes.data || []).forEach(v => venueMap.set(v.business_name?.toLowerCase(), v));

      const hospMap = new Map<string, any>();
      (hospProfilesRes.data || []).forEach(h => hospMap.set(h.business_name?.toLowerCase(), h));

      const servMap = new Map<string, any>();
      (servVendorRes.data || []).forEach(s => servMap.set(s.business_name?.toLowerCase(), s));

      // Check task-linked resource IDs
      const taskLinkedResourceIds = new Set<string>();
      if (taskAssignmentsRes.data) {
        for (const task of taskAssignmentsRes.data as any[]) {
          if (task.resource_assignments && Array.isArray(task.resource_assignments)) {
            for (const assignment of task.resource_assignments) {
              if (assignment.resource_id) {
                taskLinkedResourceIds.add(assignment.resource_id);
              }
              // Also check by name match
              if (assignment.resource) {
                taskLinkedResourceIds.add(assignment.resource);
              }
            }
          }
        }
      }

      const hasVenueBooking = (venueBookingsRes.data || []).length > 0;

      // Fetch resources properly with eventId filter
      let resourceQuery = supabase
        .from('resources')
        .select(`
          *,
          category:resource_categories!category_id(name),
          status:resource_status!status_id(name)
        `)
        .order('name');
      
      if (eventId) {
        resourceQuery = resourceQuery.eq('event_id', eventId);
      }
      
      const { data: resourcesData, error: resourcesError } = await resourceQuery;
      if (resourcesError) throw resourcesError;

      // Enrich resources with profile data
      const mappedResources: Resource[] = (resourcesData || []).map((resource: any) => {
        const resourceNameLower = resource.name?.toLowerCase() || '';
        const categoryName = resource.category?.name?.toLowerCase() || '';

        // Try to match against profile tables
        let profileSource: Resource['profile_source'] = 'local';
        let profileData: any = null;

        // Match venue profiles for Venue category resources
        if (categoryName.includes('venue') && venueMap.has(resourceNameLower)) {
          profileSource = 'venue';
          profileData = venueMap.get(resourceNameLower);
        }
        // Match hospitality profiles
        else if (categoryName.includes('hospitality') && hospMap.has(resourceNameLower)) {
          profileSource = 'hospitality';
          profileData = hospMap.get(resourceNameLower);
        }
        // Match service vendor/rental profiles
        else if ((categoryName.includes('rental') || categoryName.includes('service') || categoryName.includes('vendor')) && servMap.has(resourceNameLower)) {
          profileSource = 'service_rental';
          profileData = servMap.get(resourceNameLower);
        }
        // Try broader matching across all profile tables
        else {
          if (venueMap.has(resourceNameLower)) {
            profileSource = 'venue';
            profileData = venueMap.get(resourceNameLower);
          } else if (hospMap.has(resourceNameLower)) {
            profileSource = 'hospitality';
            profileData = hospMap.get(resourceNameLower);
          } else if (servMap.has(resourceNameLower)) {
            profileSource = 'service_rental';
            profileData = servMap.get(resourceNameLower);
          }
        }

        // Determine computed availability
        const isTaskLinked = taskLinkedResourceIds.has(resource.id) || taskLinkedResourceIds.has(resource.name);
        const isVenueBooked = hasVenueBooking && categoryName.includes('venue');
        
        let computedAvailability: Resource['computed_availability'] = 'Available';
        if (isVenueBooked || resource.allocated >= resource.total) {
          computedAvailability = 'Unavailable';
        } else if (isTaskLinked && resource.allocated > 0) {
          computedAvailability = resource.total - resource.allocated <= 1 ? 'Shortage' : 'Available';
        }

        // Override status based on computed availability
        let effectiveStatusId = resource.status_id;
        let effectiveStatusName = resource.status?.name;
        if (computedAvailability === 'Unavailable') {
          effectiveStatusId = 4;
          effectiveStatusName = 'Unavailable';
        } else if (computedAvailability === 'Shortage') {
          effectiveStatusId = 2;
          effectiveStatusName = 'Shortage';
        }

        return {
          id: resource.id,
          name: resource.name,
          category_id: resource.category_id,
          category_name: resource.category?.name,
          status_id: effectiveStatusId,
          status_name: effectiveStatusName,
          location: resource.location || profileData?.city ? `${profileData?.city || resource.location || ''}, ${profileData?.state || ''}`.replace(/, $/, '') : resource.location || '',
          allocated: resource.allocated || 0,
          total: resource.total || 0,
          event_id: resource.event_id,
          // Profile enrichment
          profile_source: profileSource,
          profile_id: profileData?.id,
          profile_cost: profileData?.cost || profileData?.price,
          profile_rating: profileData?.rating,
          profile_city: profileData?.city,
          profile_state: profileData?.state,
          profile_capacity: profileData?.capacity,
          profile_contact: profileData?.contact_name,
          profile_email: profileData?.email,
          // Availability logic
          is_task_linked: isTaskLinked,
          is_venue_booked: isVenueBooked,
          computed_availability: computedAvailability,
        };
      });

      setResources(mappedResources);

      const uniqueLocations = [...new Set(mappedResources.map(r => r.location).filter(Boolean))];
      setLocations(uniqueLocations);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error",
        description: "Failed to load resources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  // Real-time subscription
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel('resources-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'resources' },
        (payload) => {
          const changedResource = payload.new as any;
          if (changedResource?.event_id === eventId || payload.eventType === 'DELETE') {
            fetchData();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId, fetchData]);

  // Filtered resources using React state (Custom States pattern - no re-fetch)
  const filteredResources = useMemo(() => {
    let filtered = resources;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.profile_contact?.toLowerCase().includes(q)
      );
    }

    if (selectedLocation !== 'all') {
      filtered = filtered.filter(r => r.location.toLowerCase() === selectedLocation.toLowerCase());
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(r => r.category_id === parseInt(selectedCategory));
    }

    // Sort: event location resources first
    if (eventLocation) {
      const eventLocLower = eventLocation.toLowerCase();
      filtered = [...filtered].sort((a, b) => {
        const aMatch = a.location.toLowerCase().includes(eventLocLower) ? 0 : 1;
        const bMatch = b.location.toLowerCase().includes(eventLocLower) ? 0 : 1;
        return aMatch - bMatch;
      });
    }

    return filtered;
  }, [resources, searchQuery, selectedLocation, selectedCategory, eventLocation]);

  // Memoized grouped resources
  const groupedResources = useMemo(() => {
    if (groupBy === 'location') {
      const locationMap: Record<string, { display: string; resources: Resource[] }> = {};
      filteredResources.forEach(r => {
        const key = r.location.toLowerCase() || 'unassigned';
        if (!locationMap[key]) {
          locationMap[key] = { display: r.location || 'Unassigned', resources: [] };
        }
        locationMap[key].resources.push(r);
      });
      return Object.entries(locationMap).reduce((acc, [, val]) => {
        acc[val.display] = val.resources;
        return acc;
      }, {} as Record<string, Resource[]>);
    } else {
      return categories.reduce((acc, category) => {
        const catResources = filteredResources.filter(r => r.category_id === category.id);
        if (catResources.length > 0) {
          acc[category.name] = catResources;
        }
        return acc;
      }, {} as Record<string, Resource[]>);
    }
  }, [filteredResources, groupBy, categories]);

  const getStatusColor = useCallback((statusName?: string) => {
    const lowerStatus = statusName?.toLowerCase();
    if (lowerStatus?.includes('available') && !lowerStatus?.includes('un')) return 'text-green-600 bg-green-50 border-green-200';
    if (lowerStatus?.includes('shortage')) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (lowerStatus?.includes('unavailable') || lowerStatus?.includes('critical')) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-muted-foreground bg-muted border-border';
  }, []);

  const getStatusIcon = useCallback((statusName?: string) => {
    const lowerStatus = statusName?.toLowerCase();
    if (lowerStatus?.includes('available') && !lowerStatus?.includes('un')) return <CheckCircle className="h-4 w-4" />;
    if (lowerStatus?.includes('shortage')) return <AlertTriangle className="h-4 w-4" />;
    if (lowerStatus?.includes('unavailable') || lowerStatus?.includes('critical')) return <XCircle className="h-4 w-4" />;
    return <Package className="h-4 w-4" />;
  }, []);

  const getCategoryIcon = useCallback((categoryName?: string) => {
    const lowerCategory = categoryName?.toLowerCase();
    if (lowerCategory?.includes('venue')) return <MapPin className="h-4 w-4" />;
    if (lowerCategory?.includes('hospitality')) return <Utensils className="h-4 w-4" />;
    if (lowerCategory?.includes('entertainment')) return <Music className="h-4 w-4" />;
    if (lowerCategory?.includes('staff')) return <Users className="h-4 w-4" />;
    if (lowerCategory?.includes('transportation')) return <Truck className="h-4 w-4" />;
    if (lowerCategory?.includes('rental') || lowerCategory?.includes('service')) return <Settings className="h-4 w-4" />;
    if (lowerCategory?.includes('vendor')) return <Palette className="h-4 w-4" />;
    return <Package className="h-4 w-4" />;
  }, []);

  const getProfileSourceBadge = useCallback((source?: Resource['profile_source']) => {
    switch (source) {
      case 'venue': return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Venue Profile</Badge>;
      case 'hospitality': return <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">Hospitality</Badge>;
      case 'service_rental': return <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">Service Rental</Badge>;
      default: return null;
    }
  }, []);

  // Change Management: Create change request instead of direct edit (for non-admin)
  const submitResourceChangeRequest = async (resource: Resource, updates: Partial<Resource>) => {
    if (!user?.id || !eventId) return false;

    try {
      const fieldChanges: Record<string, { oldValue: any; newValue: any }> = {};
      
      if (updates.name && updates.name !== resource.name) {
        fieldChanges['resource_name'] = { oldValue: resource.name, newValue: updates.name };
      }
      if (updates.location && updates.location !== resource.location) {
        fieldChanges['resource_location'] = { oldValue: resource.location, newValue: updates.location };
      }
      if (updates.category_id && updates.category_id !== resource.category_id) {
        fieldChanges['resource_category'] = { oldValue: CATEGORY_MAP[resource.category_id] || resource.category_id, newValue: CATEGORY_MAP[updates.category_id] || updates.category_id };
      }
      if (updates.allocated !== undefined && updates.allocated !== resource.allocated) {
        fieldChanges['resource_allocated'] = { oldValue: resource.allocated, newValue: updates.allocated };
      }
      if (updates.total !== undefined && updates.total !== resource.total) {
        fieldChanges['resource_total'] = { oldValue: resource.total, newValue: updates.total };
      }

      if (Object.keys(fieldChanges).length === 0) {
        toast({ title: "No Changes", description: "No changes detected to submit." });
        return false;
      }

      const { error } = await supabase.from('change_requests').insert({
        title: `Resource Change: ${resource.name}`,
        description: `Request to modify resource "${resource.name}" (ID: ${resource.id})`,
        event_id: eventId,
        requested_by: user.id,
        change_type: 'scope' as any,
        priority: 'medium' as any,
        status: 'pending' as any,
        field_changes: fieldChanges as any,
      });

      if (error) throw error;

      toast({
        title: "Change Request Submitted",
        description: "Your resource change has been submitted for approval.",
      });

      return true;
    } catch (error) {
      console.error('Error submitting change request:', error);
      toast({
        title: "Error",
        description: "Failed to submit change request",
        variant: "destructive",
      });
      return false;
    }
  };

  // Direct edit (admin) or change request (non-admin)
  const handleEditResource = async () => {
    if (!editResource) return;
    if (!editResource.name.trim() || !editResource.category_id || !editResource.location.trim()) {
      toast({
        title: "Missing Required Fields",
        description: "Name, Category, and Location are required.",
        variant: "destructive",
      });
      return;
    }

    setSavingEdit(true);
    try {
      // Admin: direct update. Non-admin: submit change request
      if (isAdmin()) {
        // Direct update via RPC + update
        const { error: rpcError } = await supabase.rpc('update_resource_utilization', {
          p_resource_id: editResource.id,
          p_allocated: editResource.allocated,
          p_total: editResource.total,
        });
        if (rpcError) throw rpcError;

        const { error: updateError } = await supabase
          .from('resources')
          .update({
            name: editResource.name,
            category_id: editResource.category_id,
            status_id: editResource.status_id,
            location: editResource.location,
          })
          .eq('id', editResource.id);
        if (updateError) throw updateError;

        // Log the change
        if (user?.id) {
          await supabase.rpc('log_change', {
            p_entity_type: 'resource',
            p_entity_id: editResource.id,
            p_action: 'updated',
            p_field_name: 'resource',
            p_old_value: null,
            p_new_value: editResource.name,
            p_description: `Resource "${editResource.name}" updated directly by admin`,
          });
        }

        // Timeline sync: if resource was swapped (name changed), recalculate downstream
        const originalResource = resources.find(r => r.id === editResource.id);
        if (originalResource && originalResource.name !== editResource.name && eventId) {
          try {
            await supabase.rpc('recalculate_project_timeline', { p_event_id: eventId });
            toast({
              title: "Timeline Updated",
              description: "Downstream estimates recalculated after resource swap.",
            });
          } catch (timelineError) {
            console.error('Timeline recalculation error:', timelineError);
          }
        }

        toast({ title: 'Resource Updated', description: 'Resource updated successfully.' });
      } else {
        // Non-admin: submit change request
        const originalResource = resources.find(r => r.id === editResource.id);
        if (originalResource) {
          await submitResourceChangeRequest(originalResource, editResource);
        }
      }

      setIsEditDialogOpen(false);
      setEditResource(null);
      await fetchData();
    } catch (error) {
      console.error('Error updating resource:', error);
      toast({ title: 'Error', description: 'Failed to update resource', variant: 'destructive' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteResource = async (resourceId: string, resourceName: string) => {
    if (!canDelete) {
      toast({
        title: "Access Denied",
        description: "Only administrators can delete resources.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      // Log deletion
      if (user?.id) {
        await supabase.rpc('log_change', {
          p_entity_type: 'resource',
          p_entity_id: resourceId,
          p_action: 'deleted',
          p_field_name: null,
          p_old_value: resourceName,
          p_new_value: null,
          p_description: `Resource "${resourceName}" deleted`,
        });
      }

      toast({ title: 'Resource Deleted', description: `"${resourceName}" has been removed.` });
      await fetchData();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({ title: 'Error', description: 'Failed to delete resource', variant: 'destructive' });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const element = document.querySelector(`[data-id="${event.active.id}"]`) as HTMLElement;
    activeElementRef.current = element;
    if (element) {
      const rect = element.getBoundingClientRect();
      const pointer = event.activatorEvent as PointerEvent;
      if (pointer) {
        setDragOffset({ x: pointer.clientX - rect.left, y: pointer.clientY - rect.top });
      } else {
        setDragOffset({ x: rect.width / 2, y: rect.height / 2 });
      }
    } else {
      setDragOffset({ x: 150, y: 100 });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = resources.findIndex(item => item.id === active.id);
      const newIndex = resources.findIndex(item => item.id === over?.id);
      setResources(arrayMove(resources, oldIndex, newIndex));
      toast({
        title: "Resource Reassigned",
        description: "Resource allocation updated and downstream processes recalculated",
      });
    }
    setActiveId(null);
    setDragOffset(null);
    activeElementRef.current = null;
  };

  const assignResource = async (resourceId: string) => {
    try {
      const { data: resource, error: fetchError } = await supabase
        .from('resources')
        .select('allocated, total')
        .eq('id', resourceId)
        .single();

      if (fetchError) throw fetchError;

      const available = resource.total - resource.allocated;
      if (available <= 0) {
        toast({ title: "Resource Unavailable", description: "No available units to assign", variant: "destructive" });
        return;
      }

      const { data: rpcResult, error: rpcError } = await supabase.rpc('update_resource_utilization', {
        p_resource_id: resourceId,
        p_allocated: resource.allocated + 1,
        p_total: resource.total,
      });

      if (rpcError) throw rpcError;

      const result = rpcResult as { success: boolean; allocated: number; total: number; utilization_percent: number };
      setResources(prev => prev.map(r => {
        if (r.id === resourceId) {
          return {
            ...r,
            allocated: result.allocated,
            utilization_percent: result.utilization_percent,
            available_count: Math.max(0, result.total - result.allocated),
          };
        }
        return r;
      }));

      toast({ title: "Resource Assigned", description: "Resource allocation updated successfully" });
    } catch (error) {
      console.error('Error assigning resource:', error);
      toast({ title: "Error", description: "Failed to assign resource", variant: "destructive" });
    }
  };

  const syncLocationFromEvent = async () => {
    if (!eventId || !eventLocation) {
      toast({ title: "Cannot Sync", description: "Event location not available", variant: "destructive" });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('resources')
        .update({ location: eventLocation })
        .eq('event_id', eventId)
        .select();

      if (error) throw error;
      toast({ title: "Location Synced", description: `Updated ${data?.length || 0} resource(s) to ${eventLocation}` });
      fetchData();
    } catch (error) {
      console.error('Error syncing location:', error);
      toast({ title: "Sync Failed", description: "Failed to sync location to resources", variant: "destructive" });
    }
  };

  const handleAddResource = async () => {
    if (!newResource.name.trim() || !newResource.category_id || !newResource.location.trim()) {
      toast({ title: "Missing Required Fields", description: "Name, Category, and Location are required.", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.from('resources').insert([{
        name: newResource.name,
        category_id: parseInt(newResource.category_id),
        status_id: parseInt(newResource.status_id) || 1,
        location: newResource.location,
        allocated: newResource.allocated,
        total: newResource.total,
        event_id: eventId || null,
      }]);

      if (error) throw error;

      toast({ title: "Resource Added", description: "The resource has been added successfully" });
      setIsAddDialogOpen(false);
      setNewResource({ name: '', category_id: '', status_id: '', location: eventLocation || '', allocated: 0, total: 0, event_id: eventId || '' });
      fetchData();
    } catch (error) {
      console.error('Error adding resource:', error);
      toast({ title: "Error", description: "Failed to add resource", variant: "destructive" });
    }
  };

  // Card components
  const EnrichedResourceCard = ({ resource, sortable = false, sortableProps }: { resource: Resource; sortable?: boolean; sortableProps?: any }) => {
    const utilizationPercent = resource.utilization_percent ?? (resource.total > 0 ? Math.round((resource.allocated / resource.total) * 100) : 0);
    
    const getPriorityBadge = () => {
      if (utilizationPercent >= 90) return <Badge variant="destructive" className="text-xs">High Priority</Badge>;
      if (utilizationPercent >= 70) return <Badge variant="default" className="bg-orange-500 text-xs">Medium Priority</Badge>;
      if (utilizationPercent >= 50) return <Badge variant="secondary" className="text-xs">Normal</Badge>;
      return null;
    };

    const cardProps = sortable ? {
      ref: sortableProps?.setNodeRef,
      style: sortableProps?.style,
      ...sortableProps?.attributes,
      ...sortableProps?.listeners,
      'data-id': resource.id,
      className: `${sortable ? 'cursor-grab active:cursor-grabbing' : ''} shadow-sm hover:shadow-md transition-shadow`,
    } : {
      className: 'shadow-sm hover:shadow-md transition-shadow',
    };

    return (
      <Card {...cardProps}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {getCategoryIcon(resource.category_name)}
              <h3 className="font-medium">{resource.name}</h3>
              {getPriorityBadge()}
              {getProfileSourceBadge(resource.profile_source)}
            </div>
            <Badge variant="outline" className={getStatusColor(resource.status_name)}>
              {getStatusIcon(resource.status_name)}
              <span className="ml-1">{resource.status_name}</span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {resource.location || 'No location set'}
          </div>

          {/* Profile enrichment data */}
          {resource.profile_source !== 'local' && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {resource.profile_cost != null && resource.profile_cost > 0 && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  ${resource.profile_cost.toLocaleString()}
                </span>
              )}
              {resource.profile_rating != null && resource.profile_rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {resource.profile_rating}
                </span>
              )}
              {resource.profile_capacity != null && resource.profile_capacity > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Cap: {resource.profile_capacity}
                </span>
              )}
              {resource.profile_contact && (
                <span className="truncate max-w-[120px]" title={resource.profile_contact}>
                  📞 {resource.profile_contact}
                </span>
              )}
            </div>
          )}

          {/* Task/Booking indicators */}
          {(resource.is_task_linked || resource.is_venue_booked) && (
            <div className="flex items-center gap-2 flex-wrap">
              {resource.is_task_linked && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                  <LinkIcon className="h-3 w-3 mr-1" />
                  Task Linked
                </Badge>
              )}
              {resource.is_venue_booked && (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                  <Shield className="h-3 w-3 mr-1" />
                  Venue Booked
                </Badge>
              )}
            </div>
          )}

          {/* Utilization */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Utilization</span>
              <span className="font-medium">{utilizationPercent}%</span>
            </div>
            <Progress value={utilizationPercent} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Available: {resource.available_count ?? (resource.total - resource.allocated)}</span>
              <span>Allocated: {resource.allocated}/{resource.total}</span>
            </div>
          </div>

          {/* Action buttons - Role-based */}
          <div className="flex gap-2">
            {!isReadOnly && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => assignResource(resource.id)}
                disabled={resource.total - resource.allocated === 0}
                className="flex-1"
              >
                Assign
              </Button>
            )}
            {canEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditResource(resource);
                  setIsEditDialogOpen(true);
                }}
                title={isAdmin() ? "Edit (Direct)" : "Edit (Change Request)"}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDeleteResource(resource.id, resource.name)}
                title="Delete Resource"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const SortableResourceCard = ({ resource }: { resource: Resource }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: resource.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <EnrichedResourceCard
        resource={resource}
        sortable
        sortableProps={{ setNodeRef, style, attributes, listeners }}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading resources...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Resource Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage event resources and allocations
            {!isAdmin() && !isReadOnly && (
              <span className="ml-2 text-xs text-orange-600">(Edits require approval)</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {eventLocation && (
            <Button variant="outline" size="sm" onClick={syncLocationFromEvent} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Sync Location from Event
            </Button>
          )}
          {canCreate && (
            <Button variant="default" size="sm" onClick={() => setIsAddDialogOpen(true)}>
              + Add Resource
            </Button>
          )}
          <span className="text-sm text-muted-foreground">Quick Filters</span>
          <Select value={groupBy} onValueChange={(value: 'location' | 'category') => setGroupBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="location">By Location</SelectItem>
              <SelectItem value="category">By Category</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Add Resource Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Resource</DialogTitle>
            <DialogDescription>Add a new resource to your event inventory</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={newResource.name} onChange={(e) => setNewResource({ ...newResource, name: e.target.value })} placeholder="Resource name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={newResource.category_id || undefined} onValueChange={(value) => setNewResource({ ...newResource, category_id: value })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={newResource.status_id || undefined} onValueChange={(value) => setNewResource({ ...newResource, status_id: value })}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id.toString()}>{status.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location *</Label>
              <Input id="location" value={newResource.location} onChange={(e) => setNewResource({ ...newResource, location: e.target.value })} placeholder="Resource location" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="allocated">Allocated</Label>
                <Input id="allocated" type="number" value={newResource.allocated} onChange={(e) => setNewResource({ ...newResource, allocated: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="total">Total</Label>
                <Input id="total" type="number" value={newResource.total} onChange={(e) => setNewResource({ ...newResource, total: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddResource}>Add Resource</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Resource Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isAdmin() ? 'Edit Resource' : 'Request Resource Change'}
            </DialogTitle>
            <DialogDescription>
              {isAdmin()
                ? 'Edit the resource information below. Changes will be applied immediately.'
                : 'Your changes will be submitted as a change request for approval.'}
            </DialogDescription>
          </DialogHeader>
          {editResource && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={editResource.name} onChange={e => setEditResource({ ...editResource, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={editResource.category_id?.toString() || ''} onValueChange={val => setEditResource({ ...editResource, category_id: parseInt(val) })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editResource.status_id?.toString() || ''} onValueChange={val => setEditResource({ ...editResource, status_id: parseInt(val) })}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {statuses.map(stat => (
                      <SelectItem key={stat.id} value={stat.id.toString()}>{stat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input id="edit-location" value={editResource.location} onChange={e => setEditResource({ ...editResource, location: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-allocated">Allocated</Label>
                  <Input id="edit-allocated" type="number" value={editResource.allocated} onChange={e => setEditResource({ ...editResource, allocated: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-total">Total</Label>
                  <Input id="edit-total" type="number" value={editResource.total} onChange={e => setEditResource({ ...editResource, total: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditResource} disabled={savingEdit}>
              {savingEdit ? 'Saving...' : isAdmin() ? 'Save Changes' : 'Submit Change Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card className="bg-gradient-subtle border-0">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Resources</Label>
              <Input id="search" placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger><SelectValue placeholder="All Locations" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedLocation('all'); setSelectedCategory('all'); }} className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Groups */}
      {filteredResources.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>No resources found for this event. Add your first resource to get started.</p>
        </div>
      ) : (
        <Tabs defaultValue="drag-drop">
          <TabsList>
            <TabsTrigger value="drag-drop">Drag & Drop View</TabsTrigger>
            <TabsTrigger value="standard">Standard View</TabsTrigger>
          </TabsList>

          <TabsContent value="drag-drop" className="space-y-6">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              modifiers={dragOffset ? [
                ({ transform }) => ({
                  ...transform,
                  x: transform.x - dragOffset.x,
                  y: transform.y - dragOffset.y,
                })
              ] : undefined}
            >
              {Object.entries(groupedResources).map(([group, groupResources]) => (
                groupResources.length > 0 && (
                  <div key={group} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium capitalize">{group}</h3>
                      <Badge variant="secondary">{groupResources.length} resource{groupResources.length !== 1 ? 's' : ''}</Badge>
                    </div>
                    <SortableContext items={groupResources.map(r => r.id)} strategy={verticalListSortingStrategy}>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                        {groupResources.map((resource) => (
                          <SortableResourceCard key={resource.id} resource={resource} />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                )
              ))}

              <DragOverlay adjustScale={false} style={{ cursor: 'grabbing' }}>
                {activeId ? (
                  <div className="rotate-1 shadow-lg pointer-events-none"
                    style={dragOffset ? { transform: `translate(-${dragOffset.x}px, -${dragOffset.y}px)` } : {}}>
                    <EnrichedResourceCard resource={resources.find(r => r.id === activeId)!} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </TabsContent>

          <TabsContent value="standard" className="space-y-6">
            {Object.entries(groupedResources).map(([group, groupResources]) => (
              groupResources.length > 0 && (
                <div key={group} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium capitalize">{group}</h3>
                    <Badge variant="secondary">{groupResources.length} resource{groupResources.length !== 1 ? 's' : ''}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    {groupResources.map((resource) => (
                      <EnrichedResourceCard key={resource.id} resource={resource} />
                    ))}
                  </div>
                </div>
              )
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ResourceManager;

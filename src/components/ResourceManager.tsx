import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
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
  Calendar,
  Filter,
  RotateCcw,
  Truck,
  Utensils,
  Music,
  Palette,
  Settings
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
  available: number;
  allocated: number;
  total: number;
  event_id?: string;
}

interface ResourceManagerProps {
  eventId?: string;
}

const ResourceManager = ({ eventId }: ResourceManagerProps) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [statuses, setStatuses] = useState<ResourceStatus[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'location' | 'category'>('location');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch categories, statuses, and resources from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('resource_categories')
          .select('*')
          .order('name');
        
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Fetch statuses
        const { data: statusesData, error: statusesError } = await supabase
          .from('resource_status')
          .select('*')
          .order('name');
        
        if (statusesError) throw statusesError;
        setStatuses(statusesData || []);

        // Fetch resources with joins - filter by eventId if provided
        let resourcesQuery = supabase
          .from('resources')
          .select(`
            *,
            category:resource_categories!category_id(name),
            status:resource_status!status_id(name)
          `);

        // Filter by event_id if eventId is provided
        if (eventId) {
          resourcesQuery = resourcesQuery.eq('event_id', eventId);
        }

        const { data: resourcesData, error: resourcesError } = await resourcesQuery.order('name');
        
        if (resourcesError) throw resourcesError;

        // Map the data to include category and status names
        const mappedResources = (resourcesData || []).map((resource: any) => ({
          id: resource.id,
          name: resource.name,
          category_id: resource.category_id,
          category_name: resource.category?.name,
          status_id: resource.status_id,
          status_name: resource.status?.name,
          location: resource.location || '',
          available: resource.available || 0,
          allocated: resource.allocated || 0,
          total: resource.total || 0,
          event_id: resource.event_id,
        }));

        setResources(mappedResources);
        
        // Extract unique locations
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
    };

    fetchData();
  }, [eventId, toast]);

  // Filter resources based on search, location, and category
  useEffect(() => {
    let filtered = resources;

    if (searchQuery) {
      filtered = filtered.filter(resource =>
        resource.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedLocation !== 'all') {
      filtered = filtered.filter(resource => resource.location === selectedLocation);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resource => resource.category_id === parseInt(selectedCategory));
    }

    setFilteredResources(filtered);
  }, [resources, searchQuery, selectedLocation, selectedCategory]);

  const getStatusColor = (statusName?: string) => {
    const lowerStatus = statusName?.toLowerCase();
    if (lowerStatus?.includes('available')) return 'text-green-600 bg-green-50 border-green-200';
    if (lowerStatus?.includes('shortage')) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (lowerStatus?.includes('unavailable') || lowerStatus?.includes('critical')) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusIcon = (statusName?: string) => {
    const lowerStatus = statusName?.toLowerCase();
    if (lowerStatus?.includes('available')) return <CheckCircle className="h-4 w-4" />;
    if (lowerStatus?.includes('shortage')) return <AlertTriangle className="h-4 w-4" />;
    if (lowerStatus?.includes('unavailable') || lowerStatus?.includes('critical')) return <XCircle className="h-4 w-4" />;
    return <Package className="h-4 w-4" />;
  };

  const getCategoryIcon = (categoryName?: string) => {
    const lowerCategory = categoryName?.toLowerCase();
    if (lowerCategory?.includes('venue')) return <MapPin className="h-4 w-4" />;
    if (lowerCategory?.includes('catering')) return <Utensils className="h-4 w-4" />;
    if (lowerCategory?.includes('equipment')) return <Settings className="h-4 w-4" />;
    if (lowerCategory?.includes('decoration')) return <Palette className="h-4 w-4" />;
    if (lowerCategory?.includes('staff')) return <Users className="h-4 w-4" />;
    if (lowerCategory?.includes('transportation')) return <Truck className="h-4 w-4" />;
    return <Package className="h-4 w-4" />;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = resources.findIndex(item => item.id === active.id);
      const newIndex = resources.findIndex(item => item.id === over?.id);
      
      const newResources = arrayMove(resources, oldIndex, newIndex);
      setResources(newResources);
      
      // Simulate resource reallocation
      toast({
        title: "Resource Reassigned",
        description: "Resource allocation updated and downstream processes recalculated",
      });
    }

    setActiveId(null);
  };

  const assignResource = (resourceId: string, eventName: string) => {
    setResources(prev => prev.map(resource => {
      if (resource.id === resourceId && resource.available > 0) {
        return {
          ...resource,
          allocated: resource.allocated + 1,
          available: resource.available - 1,
          assignedTo: eventName,
          status: resource.available - 1 === 0 ? 'critical' : 
                   resource.available - 1 < resource.total * 0.3 ? 'shortage' : 'available'
        };
      }
      return resource;
    }));

    toast({
      title: "Resource Assigned",
      description: "Downstream processes are being recalculated",
    });
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

    const utilizationPercent = (resource.allocated / resource.total) * 100;

    return (
      <Card 
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getCategoryIcon(resource.category_name)}
              <h3 className="font-medium">{resource.name}</h3>
            </div>
            <Badge variant="outline" className={getStatusColor(resource.status_name)}>
              {getStatusIcon(resource.status_name)}
              {resource.status_name}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {resource.location}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Utilization</span>
              <span>{resource.allocated}/{resource.total}</span>
            </div>
            <Progress value={utilizationPercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Available: {resource.available}</span>
            <span>Allocated: {resource.allocated}</span>
          </div>
        </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => assignResource(resource.id, 'Current Event')}
              disabled={resource.available === 0}
              className="flex-1"
            >
              Assign
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                // Simulate recalculation
                toast({
                  title: "Processes Recalculated",
                  description: "All downstream processes have been updated",
                });
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ResourceCard = ({ resource }: { resource: Resource }) => {
    const utilizationPercent = (resource.allocated / resource.total) * 100;

    return (
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getCategoryIcon(resource.category_name)}
              <h3 className="font-medium">{resource.name}</h3>
            </div>
            <Badge variant="outline" className={getStatusColor(resource.status_name)}>
              {getStatusIcon(resource.status_name)}
              {resource.status_name}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {resource.location}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Utilization</span>
              <span>{resource.allocated}/{resource.total}</span>
            </div>
            <Progress value={utilizationPercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Available: {resource.available}</span>
            <span>Allocated: {resource.allocated}</span>
          </div>
        </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => assignResource(resource.id, 'Current Event')}
              disabled={resource.available === 0}
              className="flex-1"
            >
              Assign
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                toast({
                  title: "Processes Recalculated",
                  description: "All downstream processes have been updated",
                });
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const groupedResources = () => {
    if (groupBy === 'location') {
      return locations.reduce((acc, location) => {
        acc[location] = filteredResources.filter(r => r.location === location);
        return acc;
      }, {} as Record<string, Resource[]>);
    } else {
      return categories.reduce((acc, category) => {
        acc[category.name] = filteredResources.filter(r => r.category_id === category.id);
        return acc;
      }, {} as Record<string, Resource[]>);
    }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Resource Management</h2>
          <p className="text-sm text-muted-foreground">
            Allocate and track resources across multiple event locations
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Quick Filters
          </Button>
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

      {/* Filters */}
      <Card className="bg-gradient-subtle border-0">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Resources</Label>
              <Input
                id="search"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLocation('all');
                  setSelectedCategory('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Groups */}
      <Tabs defaultValue="drag-drop">
        <TabsList>
          <TabsTrigger value="drag-drop">Drag & Drop View</TabsTrigger>
          <TabsTrigger value="standard">Standard View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="drag-drop" className="space-y-6">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {Object.entries(groupedResources()).map(([group, groupResources]) => (
              groupResources.length > 0 && (
                <div key={group} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium capitalize">{group}</h3>
                    <Badge variant="secondary">{groupResources.length} resources</Badge>
                  </div>
                  
                  <SortableContext
                    items={groupResources.map(r => r.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupResources.map((resource) => (
                        <SortableResourceCard key={resource.id} resource={resource} />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              )
            ))}
            
            <DragOverlay>
              {activeId ? (
                <ResourceCard resource={resources.find(r => r.id === activeId)!} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </TabsContent>
        
        <TabsContent value="standard" className="space-y-6">
          {Object.entries(groupedResources()).map(([group, groupResources]) => (
            groupResources.length > 0 && (
              <div key={group} className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium capitalize">{group}</h3>
                  <Badge variant="secondary">{groupResources.length} resources</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupResources.map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              </div>
            )
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResourceManager;
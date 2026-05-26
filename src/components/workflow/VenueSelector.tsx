import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  MapPin, 
  Mail, 
  Building,
  Calendar,
  CheckCircle2,
  Search,
  Filter,
  Users,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";

interface VenueOption {
  id?: string;
  venue_type_id: number;
  business_name?: string;
  contact_name: string;
  email: string;
  phone_number?: string;
  city?: string;
  state?: string;
  zip?: string;
  capacity?: number;
  created_at?: string;
}

interface VenueType {
  id: number;
  name: string;
  description?: string;
}

interface VenueSelectorProps {
  onSelectVenue: (venueId: string) => void;
  selectedVenue?: string; // Just the ID, not the full object
}

export const VenueSelector = ({ onSelectVenue, selectedVenue }: VenueSelectorProps) => {
  const [venues, setVenues] = useState<VenueOption[]>([]);
  const [venueTypes, setVenueTypes] = useState<VenueType[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<VenueOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [zipFilter, setZipFilter] = useState("");
  const [venueTypeFilter, setVenueTypeFilter] = useState("");
  const [isAddVenueDialogOpen, setIsAddVenueDialogOpen] = useState(false);
  const [newVenue, setNewVenue] = useState({
    business_name: '',
    contact_name: '',
    email: '',
    phone_number: '',
    city: '',
    state: '',
    zip: '',
    capacity: '',
    venue_type_id: '',
    custom_type: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterVenues();
  }, [venues, searchTerm, cityFilter, stateFilter, zipFilter, venueTypeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch both venues and venue types
      const [venuesResponse, typesResponse] = await Promise.all([
        supabase.from('venues').select('*'),
        supabase.from('venue_types').select('*')
      ]);

      if (venuesResponse.error) {
        console.error('Error fetching venues:', venuesResponse.error);
        toast({
          title: "Error",
          description: "Failed to load venues. Please try again.",
          variant: "destructive"
        });
      } else {
        setVenues(venuesResponse.data || []);
      }

      if (typesResponse.error) {
        console.error('Error fetching venue types:', typesResponse.error);
        toast({
          title: "Error", 
          description: "Failed to load venue types. Please try again.",
          variant: "destructive"
        });
      } else {
        setVenueTypes(typesResponse.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterVenues = () => {
    let filtered = [...venues];

    // Only show venues with user_id null or matching current user
    filtered = filtered.filter(venue => !('user_id' in venue) || !venue.user_id || (user && venue.user_id === user.id));

    if (searchTerm) {
      filtered = filtered.filter(venue => 
        venue.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (cityFilter) {
      filtered = filtered.filter(venue => 
        venue.city?.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }

    if (stateFilter) {
      filtered = filtered.filter(venue => 
        venue.state?.toLowerCase().includes(stateFilter.toLowerCase())
      );
    }

    if (zipFilter) {
      filtered = filtered.filter(venue => 
        venue.zip?.includes(zipFilter)
      );
    }

    if (venueTypeFilter && venueTypeFilter !== "all") {
      filtered = filtered.filter(venue => 
        venue.venue_type_id === parseInt(venueTypeFilter)
      );
    }

    setFilteredVenues(filtered);
  };

  // Get venue type name by ID
  const getVenueTypeName = (typeId: number) => {
    const venueType = venueTypes.find(type => type.id === typeId);
    return venueType?.name || 'Unknown Type';
  };

  const handleBooking = async (venue: VenueOption) => {
    try {
      // Pass only the ID to the parent component
      if (venue.id) {
        onSelectVenue(venue.id);
        toast({
          title: "Success",
          description: `Selected venue: ${venue.business_name || venue.contact_name}`,
        });
      } else {
        throw new Error("Venue ID is missing");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to select venue",
        variant: "destructive",
      });
    }
  };


  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading venue options...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Select Venue Location</h2>
        <p className="text-muted-foreground">
          Find and book the perfect venue for your event based on location
        </p>
      </div>

      {/* Location-based Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Location & Venue Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Venue name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City/Town</Label>
              <Input
                id="city"
                placeholder="Enter city..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="State (e.g., CA)"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                placeholder="ZIP code..."
                value={zipFilter}
                onChange={(e) => setZipFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venueType">Venue Type</Label>
              <Select value={venueTypeFilter} onValueChange={setVenueTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Any type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any type</SelectItem>
                  {venueTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVenues.map((venue) => {
          const isSelected = selectedVenue === venue.id;
          
          return (
            <Card 
              key={venue.id || venue.created_at}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 border-2 ${
                isSelected ? 'border-primary shadow-lg' : 'border-border'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      {venue.business_name || 'Venue'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {getVenueTypeName(venue.venue_type_id)}
                    </p>
                  </div>
                  {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>
                      {[venue.city, venue.state, venue.zip].filter(Boolean).join(', ') || 'Location not specified'}
                    </span>
                  </div>
                  {venue.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{venue.email}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {venue.contact_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Contact: {venue.contact_name}</span>
                  </div>
        )}
                  {venue.capacity && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Capacity: {venue.capacity} guests</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleBooking(venue)}
                    size="sm"
                  >
                    {isSelected ? "Selected" : "Select Venue"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {/* Add Your Own Venue Card */}
        <Card className="border-dashed border-2 border-primary flex flex-col justify-center items-center min-h-[260px]">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Building className="h-10 w-10 text-primary mb-2" />
            <h3 className="text-lg font-semibold mb-2">Add Your Own Venue</h3>
            <p className="text-muted-foreground mb-4 text-center">Can't find your venue? Add your own venue information here.</p>
            <Button onClick={() => setIsAddVenueDialogOpen(true)}>
              + Add Venue
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Add Venue Dialog */}
      <Dialog open={isAddVenueDialogOpen} onOpenChange={setIsAddVenueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Your Venue</DialogTitle>
            <DialogDescription>
              Enter your venue details below. They will be saved to your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Business Name</Label>
              <Input value={newVenue.business_name} onChange={e => setNewVenue({ ...newVenue, business_name: e.target.value })} />
            </div>
            <div>
              <Label>Contact Name</Label>
              <Input value={newVenue.contact_name} onChange={e => setNewVenue({ ...newVenue, contact_name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={newVenue.email} onChange={e => setNewVenue({ ...newVenue, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <Label>City</Label>
                <Input value={newVenue.city} onChange={e => setNewVenue({ ...newVenue, city: e.target.value })} />
              </div>
              <div>
                <Label>State</Label>
                <Input value={newVenue.state} onChange={e => setNewVenue({ ...newVenue, state: e.target.value })} />
              </div>
              <div>
                <Label>ZIP</Label>
                <Input value={newVenue.zip} onChange={e => setNewVenue({ ...newVenue, zip: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <Label>Capacity</Label>
                <Input type="number" value={newVenue.capacity} onChange={e => setNewVenue({ ...newVenue, capacity: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Venue Type</Label>
              <Select
                value={newVenue.venue_type_id || undefined}
                onValueChange={value =>
                  setNewVenue({
                    ...newVenue,
                    venue_type_id: value,
                    custom_type: value === '__other__' ? newVenue.custom_type : '',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {venueTypes.map(type => (
                    <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
                  ))}
                  <SelectItem value="__other__">Other…</SelectItem>
                </SelectContent>
              </Select>
              {newVenue.venue_type_id === '__other__' ? (
                <Input
                  autoFocus
                  placeholder="Enter custom venue type"
                  maxLength={100}
                  value={newVenue.custom_type}
                  onChange={e => setNewVenue({ ...newVenue, custom_type: e.target.value })}
                />
              ) : null}
            </div>
            <Button className="w-full" onClick={async () => {
              // Get the current user
              const { data: { user } } = await supabase.auth.getUser();

              if (!user) {
                toast({ title: 'Error', description: 'You must be logged in to add a venue', variant: 'destructive' });
                return;
              }

              if (newVenue.venue_type_id === '__other__' && !newVenue.custom_type.trim()) {
                toast({ title: 'Custom type required', description: 'Please enter a custom venue type.', variant: 'destructive' });
                return;
              }

              // Prepare venue data, only include numeric fields if valid
              const venueData: any = {
                business_name: newVenue.business_name,
                contact_name: newVenue.contact_name,
                email: newVenue.email,
                phone_number: null,
                city: newVenue.city,
                state: newVenue.state,
                zip: newVenue.zip,
                user_id: user.id
              };
              if (newVenue.capacity && !isNaN(Number(newVenue.capacity))) {
                venueData.capacity = Number(newVenue.capacity);
              }
              if (newVenue.venue_type_id === '__other__') {
                venueData.venue_type_id = null;
                venueData.custom_type = newVenue.custom_type.trim();
              } else if (newVenue.venue_type_id && !isNaN(Number(newVenue.venue_type_id))) {
                venueData.venue_type_id = Number(newVenue.venue_type_id);
              }
              // Save to DB
              const { data, error } = await supabase.from('venues').insert(venueData).select().single();
              if (error) {
                toast({ title: 'Error', description: 'Failed to add venue', variant: 'destructive' });
              } else {
                setVenues(prev => [...prev, data]);
                setIsAddVenueDialogOpen(false);
                setNewVenue({ business_name: '', contact_name: '', email: '', phone_number: '', city: '', state: '', zip: '', capacity: '', venue_type_id: '', custom_type: '' });
                toast({ title: 'Venue Added', description: 'Your venue has been added.' });
              }
            }}>
              Save Venue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
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
  Phone, 
  Mail, 
  Building,
  Calendar,
  CheckCircle2,
  Search,
  Filter,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VenueOption {
  venue_type_id: string;
  ven_contact_name: string;
  ven_contact_ph_nbr: number;
  ven_email: string;
  ven_locatiom: string; // Note: using actual column name from database
  ven_biz_name?: string;
  ven_price?: number;
  ven_reservation_date?: string;
  ven_reservation_time?: string;
  created_at?: string;
}

interface VenueSelectorProps {
  onSelectVenue: (venue: VenueOption) => void;
  selectedVenue?: VenueOption;
}

export const VenueSelector = ({ onSelectVenue, selectedVenue }: VenueSelectorProps) => {
  const [venues, setVenues] = useState<VenueOption[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<VenueOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [zipFilter, setZipFilter] = useState("");
  const [venueTypeFilter, setVenueTypeFilter] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    filterVenues();
  }, [venues, searchTerm, cityFilter, stateFilter, zipFilter, venueTypeFilter]);

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('Venue Profile')
        .select('*');

      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load venue options",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterVenues = () => {
    let filtered = [...venues];

    if (searchTerm) {
      filtered = filtered.filter(venue => 
        venue.ven_contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.venue_type_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.ven_locatiom?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (cityFilter) {
      filtered = filtered.filter(venue => 
        venue.ven_locatiom?.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }

    if (stateFilter) {
      filtered = filtered.filter(venue => 
        venue.ven_locatiom?.toLowerCase().includes(stateFilter.toLowerCase())
      );
    }

    if (zipFilter) {
      filtered = filtered.filter(venue => 
        venue.ven_locatiom?.includes(zipFilter)
      );
    }

    if (venueTypeFilter && venueTypeFilter !== "all") {
      filtered = filtered.filter(venue => 
        venue.venue_type_id?.toLowerCase().includes(venueTypeFilter.toLowerCase())
      );
    }

    setFilteredVenues(filtered);
  };

  const handleBooking = async (venue: VenueOption) => {
    try {
      // Here you would implement the actual booking logic
      onSelectVenue(venue);
      toast({
        title: "Success",
        description: `Selected venue: ${venue.venue_type_id}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to select venue",
        variant: "destructive",
      });
    }
  };

  const parseAddress = (address: string) => {
    if (!address) return { city: "", state: "", zip: "" };
    
    const parts = address.split(',').map(part => part.trim());
    const lastPart = parts[parts.length - 1] || "";
    const stateZipMatch = lastPart.match(/^([A-Z]{2})\s+(\d{5}(-\d{4})?)$/);
    
    return {
      city: parts[parts.length - 2] || "",
      state: stateZipMatch ? stateZipMatch[1] : "",
      zip: stateZipMatch ? stateZipMatch[2] : ""
    };
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
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="conference">Conference Center</SelectItem>
                  <SelectItem value="banquet">Banquet Hall</SelectItem>
                  <SelectItem value="outdoor">Outdoor Venue</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="theater">Theater/Auditorium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVenues.map((venue) => {
          const isSelected = selectedVenue?.venue_type_id === venue.venue_type_id;
          const addressInfo = parseAddress(venue.ven_locatiom);
          
          return (
            <Card 
              key={venue.venue_type_id}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 border-2 ${
                isSelected ? 'border-primary shadow-lg' : 'border-border'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      {venue.venue_type_id}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Contact: {venue.ven_contact_name}
                    </p>
                  </div>
                  {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {venue.ven_locatiom && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{venue.ven_locatiom}</span>
                    </div>
                  )}
                  {venue.ven_contact_ph_nbr && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{venue.ven_contact_ph_nbr}</span>
                    </div>
                  )}
                  {venue.ven_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{venue.ven_email}</span>
                    </div>
                  )}
                </div>

                {(addressInfo.city || addressInfo.state || addressInfo.zip) && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Location Details</Label>
                    <div className="flex flex-wrap gap-1">
                      {addressInfo.city && (
                        <Badge variant="outline" className="text-xs">
                          {addressInfo.city}
                        </Badge>
                      )}
                      {addressInfo.state && (
                        <Badge variant="outline" className="text-xs">
                          {addressInfo.state}
                        </Badge>
                      )}
                      {addressInfo.zip && (
                        <Badge variant="outline" className="text-xs">
                          {addressInfo.zip}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    variant="outline"
                    size="sm"
                  >
                    View Details
                  </Button>
                  <Button 
                    className="flex-1" 
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleBooking(venue)}
                    size="sm"
                  >
                    {isSelected ? "Selected" : "Book Venue"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredVenues.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No venues found matching your location criteria. Try adjusting your filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
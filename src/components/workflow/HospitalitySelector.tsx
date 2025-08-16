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
  DollarSign, 
  Star, 
  Calendar,
  CheckCircle2,
  Search,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HospitalityOption {
  hosp_type_id: string;
  hosp_biz_name: string;
  hosp_contact_name: string;
  hosp_contact_nbr: number;
  hosp_website: string;
  hosp_location: string[];
  hosp_cost: number;
  hosp_amendities: string[];
}

interface HospitalitySelectorProps {
  onSelectHospitality: (hospitality: HospitalityOption) => void;
  selectedHospitality?: HospitalityOption;
}

export const HospitalitySelector = ({ onSelectHospitality, selectedHospitality }: HospitalitySelectorProps) => {
  const [hospitalities, setHospitalities] = useState<HospitalityOption[]>([]);
  const [filteredHospitalities, setFilteredHospitalities] = useState<HospitalityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchHospitalities();
  }, []);

  useEffect(() => {
    filterHospitalities();
  }, [hospitalities, searchTerm, locationFilter, typeFilter, maxBudget]);

  const fetchHospitalities = async () => {
    try {
      const { data, error } = await supabase
        .from('Hospitality Profile')
        .select('*');

      if (error) throw error;
      setHospitalities(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load hospitality options",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterHospitalities = () => {
    let filtered = [...hospitalities];

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.hosp_biz_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.hosp_contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (locationFilter) {
      filtered = filtered.filter(item => 
        item.hosp_location?.some(loc => 
          loc.toLowerCase().includes(locationFilter.toLowerCase())
        )
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(item => 
        item.hosp_type_id?.toLowerCase().includes(typeFilter.toLowerCase())
      );
    }

    if (maxBudget) {
      const budget = parseFloat(maxBudget);
      filtered = filtered.filter(item => 
        item.hosp_cost <= budget
      );
    }

    setFilteredHospitalities(filtered);
  };

  const handleBooking = async (hospitality: HospitalityOption) => {
    try {
      // Here you would implement the actual booking logic
      onSelectHospitality(hospitality);
      toast({
        title: "Success",
        description: `Selected ${hospitality.hosp_biz_name} for your event`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to select hospitality option",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading hospitality options...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Select Hospitality Services</h2>
        <p className="text-muted-foreground">
          Choose from available hospitality providers for your event
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Business name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="City, State, ZIP..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Service Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Any type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any type</SelectItem>
                  <SelectItem value="catering">Catering</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="bar">Bar Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Max Budget</Label>
              <Input
                id="budget"
                type="number"
                placeholder="$0"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHospitalities.map((hospitality) => {
          const isSelected = selectedHospitality?.hosp_type_id === hospitality.hosp_type_id;
          
          return (
            <Card 
              key={hospitality.hosp_type_id}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 border-2 ${
                isSelected ? 'border-primary shadow-lg' : 'border-border'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{hospitality.hosp_biz_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Contact: {hospitality.hosp_contact_name}
                    </p>
                  </div>
                  {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {hospitality.hosp_location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{hospitality.hosp_location.join(", ")}</span>
                    </div>
                  )}
                  {hospitality.hosp_contact_nbr && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{hospitality.hosp_contact_nbr}</span>
                    </div>
                  )}
                  {hospitality.hosp_website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{hospitality.hosp_website}</span>
                    </div>
                  )}
                  {hospitality.hosp_cost && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">${hospitality.hosp_cost}</span>
                    </div>
                  )}
                </div>

                {hospitality.hosp_amendities && hospitality.hosp_amendities.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Amenities</Label>
                    <div className="flex flex-wrap gap-1">
                      {hospitality.hosp_amendities.slice(0, 3).map((amenity, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                      {hospitality.hosp_amendities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{hospitality.hosp_amendities.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => handleBooking(hospitality)}
                >
                  {isSelected ? "Selected" : "Select & Book"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredHospitalities.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No hospitality options found matching your criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
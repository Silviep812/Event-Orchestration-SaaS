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

interface HospitalityType {
  id: number;
  name: string;
}

interface HospitalityOption {
  id: string;
  business_name: string;
  contact_name: string;
  phone_number: string;
  website: string;
  city: string;
  state: string;
  zip: string;
  hospitality_type: number;
  hospitality_type_details: HospitalityType;
}

interface HospitalitySelectorProps {
  onSelectHospitality: (hospitalityId: string) => void;
  selectedHospitality?: string; // Just the ID, not the full object
}

export const HospitalitySelector = ({ onSelectHospitality, selectedHospitality }: HospitalitySelectorProps) => {
  const [hospitalities, setHospitalities] = useState<HospitalityOption[]>([]);
  const [filteredHospitalities, setFilteredHospitalities] = useState<HospitalityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [hospitalityTypes, setHospitalityTypes] = useState<HospitalityType[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // fetchHospitalityTypes();
    fetchHospitalities();
  }, []);

  useEffect(() => {
    filterHospitalities();
  }, [hospitalities, searchTerm, locationFilter, typeFilter, maxBudget]);

  const fetchHospitalities = async () => {
     // Fetch hospitality types first
      const { data: typesData, error: typesError } = await supabase
        .from('hospitality_types')
        .select('*');

      if (typesError) throw typesError;
      setHospitalityTypes(typesData || []);

    try {
      const { data, error } = await supabase
        .from('hospitality_profiles')
        .select(`
          *,
          hospitality_type_details:hospitality_types(*)
        `);

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
        item.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (locationFilter) {
      filtered = filtered.filter(item => 
        [item.city, item.state, item.zip]
          .filter(Boolean)
          .some(loc =>
            loc.toLowerCase().includes(locationFilter.toLowerCase())
          )
      );
    }

    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.hospitality_type === parseInt(typeFilter)
      );
    }

    setFilteredHospitalities(filtered);
  };

  const handleBooking = async (hospitality: HospitalityOption) => {
    try {
      // Pass only the ID to the parent component
      onSelectHospitality(hospitality.id);
      toast({
        title: "Success",
        description: `Selected ${hospitality.business_name} for your event`,
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <Label htmlFor="type">Hospitality Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Any type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any type</SelectItem>
                  {hospitalityTypes.map((type) => (
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
        {filteredHospitalities.map((hospitality) => {
          const isSelected = selectedHospitality === hospitality.id;
          
          return (
            <Card 
              key={hospitality.id}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 border-2 ${
                isSelected ? 'border-primary shadow-lg' : 'border-border'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{hospitality.business_name}</CardTitle>
                    {hospitality.contact_name && (
                    <p className="text-sm text-muted-foreground">
                      Contact: {hospitality.contact_name}
                    </p>
                    )}
                  </div>
                  {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {[hospitality.city, hospitality.state, hospitality.zip].filter(Boolean).join(', ') && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{[hospitality.city, hospitality.state, hospitality.zip].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  {hospitality.phone_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{hospitality.phone_number}</span>
                    </div>
                  )}
                  {hospitality.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{hospitality.website}</span>
                    </div>
                  )}
                </div>

                <Button 
                  className="w-full" 
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => handleBooking(hospitality)}
                >
                  {isSelected ? "Selected" : "Select"}
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
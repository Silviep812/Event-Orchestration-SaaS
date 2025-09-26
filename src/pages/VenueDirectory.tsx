import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building, Home, Utensils, MapPin, Trees, Dumbbell, Warehouse, Users, Building2, Hotel, ShoppingBag, HelpCircle } from "lucide-react";

const VenueDirectory = () => {
  const [venueTypes, setVenueTypes] = useState<any[]>([]);
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock venue profiles data
  const mockVenueProfiles = [
    {
      id: 1,
      venue_name: "Grand Ballroom at The Ritz",
      contact_name: "Elizabeth Parker",
      email: "elizabeth@ritzgrand.com",
      contact_phone: "(555) 123-4567",
      type: "business_location",
      capacity: 300,
      price: 5000,
      location: "Downtown Los Angeles, CA",
      available_dates: "2024-01-15 to 2024-12-31",
      description: "Elegant ballroom with crystal chandeliers and marble floors, perfect for upscale events",
      amenities: ["Catering kitchen", "AV equipment", "Valet parking", "Bridal suite"],
      venue_type: "Ballroom"
    },
    {
      id: 2,
      venue_name: "Sunset Beach Resort",
      contact_name: "Carlos Rodriguez",
      email: "carlos@sunsetbeach.com",
      contact_phone: "(555) 987-6543",
      type: "resort_location",
      capacity: 150,
      price: 8000,
      location: "Malibu, CA",
      available_dates: "2024-02-01 to 2024-11-30",
      description: "Beachfront resort with panoramic ocean views and outdoor ceremony spaces",
      amenities: ["Ocean view", "Outdoor terrace", "Beach access", "On-site catering"],
      venue_type: "Resort"
    },
    {
      id: 3,
      venue_name: "The Historic Manor House",
      contact_name: "Victoria Smith",
      email: "victoria@historicmanor.com",
      contact_phone: "(555) 456-7890",
      type: "private_resident",
      capacity: 80,
      price: 3500,
      location: "Napa Valley, CA",
      available_dates: "2024-03-01 to 2024-10-31",
      description: "Charming Victorian manor with beautiful gardens and vineyard views",
      amenities: ["Historic architecture", "Garden ceremony space", "Wine cellar", "Guest quarters"],
      venue_type: "Private Estate"
    },
    {
      id: 4,
      venue_name: "Metropolitan Sports Complex",
      contact_name: "Michael Johnson",
      email: "michael@metrosports.com",
      contact_phone: "(555) 321-0987",
      type: "sporting_facility",
      capacity: 500,
      price: 2500,
      location: "Chicago, IL",
      available_dates: "2024-01-01 to 2024-12-31",
      description: "Modern sports facility with multiple event spaces and state-of-the-art amenities",
      amenities: ["Multiple event rooms", "Concession stands", "Ample parking", "Sound system"],
      venue_type: "Sports Facility"
    },
    {
      id: 5,
      venue_name: "Bella Vista Restaurant",
      contact_name: "Isabella Martinez",
      email: "isabella@bellavista.com",
      contact_phone: "(555) 654-3210",
      type: "restaurant_location",
      capacity: 120,
      price: 2800,
      location: "Miami, FL",
      available_dates: "2024-04-01 to 2024-09-30",
      description: "Upscale Italian restaurant with private dining rooms and rooftop terrace",
      amenities: ["Private dining room", "Rooftop terrace", "Full kitchen", "Wine selection"],
      venue_type: "Restaurant"
    },
    {
      id: 6,
      venue_name: "Countryside Barn & Farm",
      contact_name: "Sarah Thompson",
      email: "sarah@countrysidebarn.com",
      contact_phone: "(555) 789-0123",
      type: "agri_farming",
      capacity: 200,
      price: 1800,
      location: "Austin, TX",
      available_dates: "2024-05-01 to 2024-08-31",
      description: "Rustic barn venue surrounded by rolling hills and farmland, perfect for country weddings",
      amenities: ["Rustic barn", "Outdoor ceremony space", "Farmland views", "Vintage decor"],
      venue_type: "Farm Venue"
    },
    {
      id: 7,
      venue_name: "Elite Country Club",
      contact_name: "James Wilson",
      email: "james@elitecc.com",
      contact_phone: "(555) 111-2222",
      type: "private_club",
      capacity: 180,
      price: 4500,
      location: "Scottsdale, AZ",
      available_dates: "2024-06-01 to 2024-12-15",
      description: "Exclusive country club with golf course views and luxury amenities",
      amenities: ["Golf course views", "Clubhouse", "Professional staff", "Member privileges"],
      venue_type: "Country Club"
    },
    {
      id: 8,
      venue_name: "Industrial Loft Warehouse",
      contact_name: "Rachel Davis",
      email: "rachel@industrialloft.com",
      contact_phone: "(555) 333-4444",
      type: "warehouse",
      capacity: 400,
      price: 2200,
      location: "Portland, OR",
      available_dates: "2024-03-15 to 2024-11-15",
      description: "Converted warehouse with exposed brick walls and industrial charm",
      amenities: ["Exposed brick", "High ceilings", "Open floor plan", "Urban location"],
      venue_type: "Industrial Venue"
    }
  ];

  // Filter profiles based on selected venue types
  const filteredProfiles = selectedVenueTypes.length > 0 
    ? mockVenueProfiles.filter(profile => selectedVenueTypes.includes(profile.type))
    : mockVenueProfiles;

  const venueTypeOptions = [
    { value: "private_resident", label: "Private Resident", icon: Home },
    { value: "business_location", label: "Business Location", icon: Building },
    { value: "restaurant_location", label: "Restaurant Location", icon: Utensils },
    { value: "resort_location", label: "Resort Location", icon: Hotel },
    { value: "recreation_location", label: "Recreation Location", icon: Trees },
    { value: "private_club", label: "Private Club", icon: Users },
    { value: "market_place", label: "Market Place", icon: ShoppingBag },
    { value: "local_govern_location", label: "Local Government Location", icon: Building2 },
    { value: "hospitality_location", label: "Hospitality Location", icon: Hotel },
    { value: "agri_farming", label: "Agri-Farming", icon: Trees },
    { value: "warehouse", label: "Warehouse", icon: Warehouse },
    { value: "state_govern_location", label: "State Government Location", icon: Building2 },
    { value: "sporting_facility", label: "Sporting Facility", icon: Dumbbell },
    { value: "other", label: "Other", icon: HelpCircle }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Venue Directory</h1>
        <p className="text-muted-foreground">
          Browse and manage event venues
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Venue Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">Venue Types (select all that apply)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {venueTypeOptions.map((option) => {
                const IconComponent = option.icon;
                const isChecked = selectedVenueTypes.includes(option.value);
                return (
                  <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={option.value}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedVenueTypes([...selectedVenueTypes, option.value]);
                        } else {
                          setSelectedVenueTypes(selectedVenueTypes.filter(type => type !== option.value));
                        }
                      }}
                    />
                    <label htmlFor={option.value} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <IconComponent size={16} />
                      {option.label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
          
          {selectedVenueTypes.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Selected Venue Types:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedVenueTypes.map(type => (
                  <span key={type} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {venueTypeOptions.find(opt => opt.value === type)?.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={() => setSelectedVenueTypes([])} 
            variant="outline"
            disabled={selectedVenueTypes.length === 0}
          >
            Clear All Selections
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Venue Profiles ({filteredProfiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProfiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No venue profiles match your selected criteria.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => {
                const typeOption = venueTypeOptions.find(opt => opt.value === profile.type);
                const IconComponent = typeOption?.icon || HelpCircle;
                
                return (
                  <Card key={profile.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{profile.venue_name}</CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {profile.venue_type} • {typeOption?.label || 'Other'}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="font-semibold">{profile.contact_name}</p>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                        <p className="text-sm text-muted-foreground">{profile.contact_phone}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p><strong>Location:</strong> {profile.location}</p>
                        <p><strong>Price:</strong> ${profile.price.toLocaleString()}</p>
                        <p><strong>Capacity:</strong> {profile.capacity} guests</p>
                        <p><strong>Available:</strong> {profile.available_dates}</p>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{profile.description}</p>
                      
                      {profile.amenities.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Amenities:</p>
                          <div className="flex flex-wrap gap-1">
                            {profile.amenities.map((amenity, index) => (
                              <span key={index} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VenueDirectory;
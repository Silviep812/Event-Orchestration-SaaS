import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bus, Car, Truck, Crown, Package } from "lucide-react";

const TransportationDirectory = () => {
  const [transportationTypes, setTransportationTypes] = useState<any[]>([]);
  const [selectedTransportationTypes, setSelectedTransportationTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock transportation profiles data
  const mockTransportationProfiles = [
    {
      id: 1,
      business_name: "Elite Charter Bus Services",
      contact_name: "Robert Johnson",
      email: "robert@elitecharter.com",
      contact_phone: "(555) 123-4567",
      type: "bus",
      seating_capacity: 56,
      price: 1200,
      location: "Chicago, IL",
      available_dates: "2024-01-15 to 2024-12-31",
      description: "Luxury charter buses for group transportation and events",
      special_accommodations: ["Wheelchair accessible", "WiFi", "Air conditioning"]
    },
    {
      id: 2,
      business_name: "Premium Van Rentals",
      contact_name: "Sarah Chen",
      email: "sarah@premiumvans.com",
      contact_phone: "(555) 987-6543",
      type: "van",
      seating_capacity: 12,
      price: 450,
      location: "Los Angeles, CA",
      available_dates: "2024-02-01 to 2024-11-30",
      description: "Spacious vans perfect for small group transportation",
      special_accommodations: ["GPS navigation", "Bluetooth audio"]
    },
    {
      id: 3,
      business_name: "Luxury Limousine Fleet",
      contact_name: "Michael Rodriguez",
      email: "michael@luxurylimo.com",
      contact_phone: "(555) 456-7890",
      type: "limo",
      seating_capacity: 8,
      price: 800,
      location: "New York, NY",
      available_dates: "2024-03-01 to 2024-10-31",
      description: "Premium limousine service for special occasions and corporate events",
      special_accommodations: ["Mini bar", "Entertainment system", "Privacy partition"]
    },
    {
      id: 4,
      business_name: "Executive Car Service",
      contact_name: "Jennifer Wilson",
      email: "jennifer@executivecar.com",
      contact_phone: "(555) 321-0987",
      type: "car_suv",
      seating_capacity: 4,
      price: 300,
      location: "Miami, FL",
      available_dates: "2024-01-01 to 2024-12-31",
      description: "Professional car and SUV service for airport transfers and business travel",
      special_accommodations: ["Child car seats available", "Flight tracking"]
    },
    {
      id: 5,
      business_name: "Heavy Duty Transport",
      contact_name: "David Park",
      email: "david@heavyduty.com",
      contact_phone: "(555) 654-3210",
      type: "truck",
      seating_capacity: 3,
      price: 600,
      location: "Denver, CO",
      available_dates: "2024-04-01 to 2024-09-30",
      description: "Truck rental for equipment transport and moving services",
      special_accommodations: ["Cargo insurance", "Loading equipment"]
    },
    {
      id: 6,
      business_name: "Specialty Transport Solutions",
      contact_name: "Lisa Martinez",
      email: "lisa@specialtytransport.com",
      contact_phone: "(555) 789-0123",
      type: "other",
      seating_capacity: 20,
      price: 950,
      location: "Austin, TX",
      available_dates: "2024-05-01 to 2024-08-31",
      description: "Custom transportation solutions including party buses and specialty vehicles",
      special_accommodations: ["Sound system", "LED lighting", "Custom branding"]
    }
  ];

  // Filter profiles based on selected transportation types
  const filteredProfiles = selectedTransportationTypes.length > 0 
    ? mockTransportationProfiles.filter(profile => selectedTransportationTypes.includes(profile.type))
    : mockTransportationProfiles;

  const transportationTypeOptions = [
    { value: "bus", label: "Bus", icon: Bus },
    { value: "van", label: "Van", icon: Car },
    { value: "car_suv", label: "Car/SUV", icon: Car },
    { value: "limo", label: "Limousine", icon: Crown },
    { value: "truck", label: "Truck", icon: Truck },
    { value: "other", label: "Other", icon: Package }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transportation Directory</h1>
        <p className="text-muted-foreground">
          Manage transportation services and options
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Transportation Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">Transportation Types (select all that apply)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {transportationTypeOptions.map((option) => {
                const IconComponent = option.icon;
                const isChecked = selectedTransportationTypes.includes(option.value);
                return (
                  <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={option.value}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTransportationTypes([...selectedTransportationTypes, option.value]);
                        } else {
                          setSelectedTransportationTypes(selectedTransportationTypes.filter(type => type !== option.value));
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
          
          {selectedTransportationTypes.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Selected Transportation Types:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedTransportationTypes.map(type => (
                  <span key={type} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {transportationTypeOptions.find(opt => opt.value === type)?.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={() => setSelectedTransportationTypes([])} 
            variant="outline"
            disabled={selectedTransportationTypes.length === 0}
          >
            Clear All Selections
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transportation Profiles ({filteredProfiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProfiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No transportation profiles match your selected criteria.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => {
                const typeOption = transportationTypeOptions.find(opt => opt.value === profile.type);
                const IconComponent = typeOption?.icon || Package;
                
                return (
                  <Card key={profile.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{profile.business_name}</CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {typeOption?.label || 'Other'}
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
                        <p><strong>Capacity:</strong> {profile.seating_capacity} seats</p>
                        <p><strong>Available:</strong> {profile.available_dates}</p>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{profile.description}</p>
                      
                      {profile.special_accommodations.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Accommodations:</p>
                          <div className="flex flex-wrap gap-1">
                            {profile.special_accommodations.map((accommodation, index) => (
                              <span key={index} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                                {accommodation}
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

export default TransportationDirectory;
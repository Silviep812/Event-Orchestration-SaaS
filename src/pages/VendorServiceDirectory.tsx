import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Camera, Lightbulb, Music, Gamepad2, Flower, Home, Table } from "lucide-react";

const VendorServiceDirectory = () => {
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock service rental profiles data
  const mockServiceProfiles = [
    {
      id: 1,
      business_name: "Premier Event Rentals",
      contact_name: "David Martinez",
      email: "david@premierevent.com",
      contact_phone: "(555) 123-4567",
      type: "table_chairs",
      price_per_day: 250,
      location: "Los Angeles, CA",
      available_dates: "2024-01-15 to 2024-12-31",
      description: "Complete table and chair rental service for events of all sizes",
      items: ["Round tables", "Rectangular tables", "Chiavari chairs", "Linens"]
    },
    {
      id: 2,
      business_name: "Illuminate Events",
      contact_name: "Sarah Johnson",
      email: "sarah@illuminateevents.com",
      contact_phone: "(555) 987-6543",
      type: "lighting",
      price_per_day: 800,
      location: "New York, NY",
      available_dates: "2024-02-01 to 2024-11-30",
      description: "Professional lighting equipment and design for spectacular events",
      items: ["LED uplighting", "String lights", "Spotlights", "Dance floor lighting"]
    },
    {
      id: 3,
      business_name: "Sound & Vision Pro",
      contact_name: "Mike Chen",
      email: "mike@soundvision.com",
      contact_phone: "(555) 456-7890",
      type: "audio_visual_equip",
      price_per_day: 1200,
      location: "Chicago, IL",
      available_dates: "2024-03-01 to 2024-10-31",
      description: "High-quality AV equipment and technical support for events",
      items: ["Sound systems", "Microphones", "Projectors", "Screens"]
    },
    {
      id: 4,
      business_name: "Shelter Solutions",
      contact_name: "Jennifer Wilson",
      email: "jennifer@sheltersolutions.com",
      contact_phone: "(555) 321-0987",
      type: "tents",
      price_per_day: 600,
      location: "Miami, FL",
      available_dates: "2024-01-01 to 2024-12-31",
      description: "Weather protection and elegant tent rentals for outdoor events",
      items: ["Party tents", "Canopies", "Market umbrellas", "Sidewalls"]
    },
    {
      id: 5,
      business_name: "Capture Moments Photo Booths",
      contact_name: "Lisa Park",
      email: "lisa@capturemoments.com",
      contact_phone: "(555) 654-3210",
      type: "photo_both",
      price_per_day: 450,
      location: "Seattle, WA",
      available_dates: "2024-04-01 to 2024-09-30",
      description: "Fun and interactive photo booth experiences for memorable events",
      items: ["Open-air booth", "Props", "Custom backdrops", "Digital gallery"]
    },
    {
      id: 6,
      business_name: "Bloom & Decor Rentals",
      contact_name: "Amanda Rodriguez",
      email: "amanda@bloomdecor.com",
      contact_phone: "(555) 789-0123",
      type: "flowers_plants",
      price_per_day: 350,
      location: "Austin, TX",
      available_dates: "2024-05-01 to 2024-08-31",
      description: "Beautiful floral arrangements and plant rentals for event decoration",
      items: ["Centerpieces", "Potted plants", "Floral walls", "Arch decorations"]
    },
    {
      id: 7,
      business_name: "Game Night Rentals",
      contact_name: "Robert Anderson",
      email: "robert@gamenight.com",
      contact_phone: "(555) 111-2222",
      type: "game_tables",
      price_per_day: 300,
      location: "Denver, CO",
      available_dates: "2024-06-01 to 2024-12-15",
      description: "Casino tables and game rentals for entertainment at events",
      items: ["Poker tables", "Blackjack tables", "Roulette wheels", "Dealers available"]
    },
    {
      id: 8,
      business_name: "Elite Housewares Rentals",
      contact_name: "Emma Thompson",
      email: "emma@elitehousewares.com",
      contact_phone: "(555) 333-4444",
      type: "housewares",
      price_per_day: 150,
      location: "San Francisco, CA",
      available_dates: "2024-03-15 to 2024-11-15",
      description: "Premium housewares and serving equipment for elegant events",
      items: ["Fine china", "Glassware", "Silverware", "Serving platters"]
    },
    {
      id: 9,
      business_name: "Comfort Station Rentals",
      contact_name: "Mark Davis",
      email: "mark@comfortstation.com",
      contact_phone: "(555) 555-6666",
      type: "potty_johns",
      price_per_day: 120,
      location: "Phoenix, AZ",
      available_dates: "2024-01-01 to 2024-12-31",
      description: "Clean and well-maintained portable restroom facilities",
      items: ["Standard units", "Luxury trailers", "Hand wash stations", "ADA compliant"]
    }
  ];

  // Filter profiles based on selected service types
  const filteredProfiles = selectedServiceTypes.length > 0 
    ? mockServiceProfiles.filter(profile => selectedServiceTypes.includes(profile.type))
    : mockServiceProfiles;

  const serviceTypeOptions = [
    { value: "transport_options", label: "Transportation Options", icon: Truck },
    { value: "photo_both", label: "Photo Booth", icon: Camera },
    { value: "lighting", label: "Lighting", icon: Lightbulb },
    { value: "audio_visual_equip", label: "Audio Visual Equipment", icon: Music },
    { value: "game_tables", label: "Game Tables", icon: Gamepad2 },
    { value: "flowers_plants", label: "Flowers & Plants", icon: Flower },
    { value: "tents", label: "Tents", icon: Home },
    { value: "table_chairs", label: "Tables & Chairs", icon: Table },
    { value: "housewares", label: "Housewares", icon: Home },
    { value: "entertainment_options", label: "Entertainment Options", icon: Music },
    { value: "potty_johns", label: "Portable Toilets", icon: Home },
    { value: "prod_props", label: "Production Props", icon: Camera },
    { value: "venue_space_decor", label: "Venue Space Decor", icon: Flower },
    { value: "child_play_equip", label: "Child Play Equipment", icon: Gamepad2 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendor Service Rental/Buy Directory</h1>
        <p className="text-muted-foreground">
          Browse vendor services and rental options
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Service Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">Service Types (select all that apply)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {serviceTypeOptions.map((option) => {
                const IconComponent = option.icon;
                const isChecked = selectedServiceTypes.includes(option.value);
                return (
                  <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={option.value}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedServiceTypes([...selectedServiceTypes, option.value]);
                        } else {
                          setSelectedServiceTypes(selectedServiceTypes.filter(type => type !== option.value));
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
          
          {selectedServiceTypes.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Selected Service Types:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedServiceTypes.map(type => (
                  <span key={type} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {serviceTypeOptions.find(opt => opt.value === type)?.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={() => setSelectedServiceTypes([])} 
            variant="outline"
            disabled={selectedServiceTypes.length === 0}
          >
            Clear All Selections
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Profiles ({filteredProfiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProfiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No service profiles match your selected criteria.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => {
                const typeOption = serviceTypeOptions.find(opt => opt.value === profile.type);
                const IconComponent = typeOption?.icon || Home;
                
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
                        <p><strong>Price/Day:</strong> ${profile.price_per_day}</p>
                        <p className="col-span-2"><strong>Available:</strong> {profile.available_dates}</p>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{profile.description}</p>
                      
                      {profile.items.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Items Available:</p>
                          <div className="flex flex-wrap gap-1">
                            {profile.items.map((item, index) => (
                              <span key={index} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1">
                          Request Quote
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          View Catalog
                        </Button>
                      </div>
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

export default VendorServiceDirectory;
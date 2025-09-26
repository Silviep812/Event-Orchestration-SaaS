import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChefHat, Camera, Utensils, Cake, Truck, Flower } from "lucide-react";

const ServiceVendorDirectory = () => {
  const [vendorTypes, setVendorTypes] = useState<any[]>([]);
  const [selectedVendorTypes, setSelectedVendorTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock service vendor profiles data
  const mockVendorProfiles = [
    {
      id: 1,
      business_name: "Gourmet Delights Catering",
      contact_name: "Maria Rodriguez",
      email: "maria@gourmetdelights.com",
      contact_phone: "(555) 123-4567",
      type: "caterer",
      price: 3500,
      location: "San Francisco, CA",
      available_dates: "2024-01-15 to 2024-12-31",
      description: "Full-service catering for weddings, corporate events, and special occasions",
      specialties: ["Italian cuisine", "Vegetarian options", "Custom menus"]
    },
    {
      id: 2,
      business_name: "Chef Alexander's Kitchen",
      contact_name: "Alexander Thompson",
      email: "alex@chefalexander.com",
      contact_phone: "(555) 987-6543",
      type: "chef",
      price: 2000,
      location: "New York, NY",
      available_dates: "2024-02-01 to 2024-11-30",
      description: "Private chef services for intimate gatherings and exclusive events",
      specialties: ["French cuisine", "Molecular gastronomy", "Wine pairing"]
    },
    {
      id: 3,
      business_name: "Sweet Dreams Bakery",
      contact_name: "Sarah Johnson",
      email: "sarah@sweetdreams.com",
      contact_phone: "(555) 456-7890",
      type: "bakery",
      price: 800,
      location: "Chicago, IL",
      available_dates: "2024-03-01 to 2024-10-31",
      description: "Custom wedding cakes, desserts, and pastries for all occasions",
      specialties: ["Wedding cakes", "Gluten-free options", "Custom designs"]
    },
    {
      id: 4,
      business_name: "Cinematic Moments",
      contact_name: "David Chen",
      email: "david@cinematicmoments.com",
      contact_phone: "(555) 321-0987",
      type: "videographer",
      price: 2500,
      location: "Los Angeles, CA",
      available_dates: "2024-01-01 to 2024-12-31",
      description: "Professional videography for weddings and corporate events",
      specialties: ["4K filming", "Drone footage", "Same-day highlights"]
    },
    {
      id: 5,
      business_name: "Bloom & Petal Florists",
      contact_name: "Jennifer Park",
      email: "jennifer@bloomandpetal.com",
      contact_phone: "(555) 654-3210",
      type: "florist",
      price: 1200,
      location: "Seattle, WA",
      available_dates: "2024-04-01 to 2024-09-30",
      description: "Elegant floral arrangements and wedding decorations",
      specialties: ["Bridal bouquets", "Centerpieces", "Seasonal flowers"]
    },
    {
      id: 6,
      business_name: "Rolling Feast Food Truck",
      contact_name: "Mike Wilson",
      email: "mike@rollingfeast.com",
      contact_phone: "(555) 789-0123",
      type: "food_truck",
      price: 1500,
      location: "Austin, TX",
      available_dates: "2024-05-01 to 2024-08-31",
      description: "Gourmet street food and mobile catering services",
      specialties: ["BBQ", "Tacos", "Vegan options"]
    },
    {
      id: 7,
      business_name: "Artisan Brew Company",
      contact_name: "Lisa Martinez",
      email: "lisa@artisanbrew.com",
      contact_phone: "(555) 111-2222",
      type: "brewery",
      price: 900,
      location: "Denver, CO",
      available_dates: "2024-06-01 to 2024-12-15",
      description: "Craft beer services and mobile bar setup for events",
      specialties: ["Craft beer", "Custom labels", "Beer tasting"]
    },
    {
      id: 8,
      business_name: "Tuscany Vineyards",
      contact_name: "Robert Anderson",
      email: "robert@tuscanyvineyards.com",
      contact_phone: "(555) 333-4444",
      type: "winery",
      price: 1800,
      location: "Napa Valley, CA",
      available_dates: "2024-03-15 to 2024-11-15",
      description: "Premium wine services and sommelier experiences",
      specialties: ["Wine tasting", "Sommelier service", "Custom wine selection"]
    }
  ];

  // Filter profiles based on selected vendor types
  const filteredProfiles = selectedVendorTypes.length > 0 
    ? mockVendorProfiles.filter(profile => selectedVendorTypes.includes(profile.type))
    : mockVendorProfiles;

  const vendorTypeOptions = [
    { value: "caterer", label: "Caterer", icon: Utensils },
    { value: "chef", label: "Chef", icon: ChefHat },
    { value: "bakery", label: "Bakery", icon: Cake },
    { value: "videographer", label: "Videographer", icon: Camera },
    // Vendor Directory entries
    { value: "food_truck", label: "Food Truck", icon: Truck },
    { value: "mobile_pop_up", label: "Mobile Pop-Up", icon: Truck },
    { value: "ice_sculpure", label: "Ice Sculpture", icon: Utensils },
    { value: "florist", label: "Florist", icon: Flower },
    { value: "foodies", label: "Foodies", icon: Utensils },
    { value: "beverage", label: "Beverage", icon: Utensils },
    { value: "brewery", label: "Brewery", icon: Utensils },
    { value: "winery", label: "Winery", icon: Utensils },
    { value: "other", label: "Other", icon: Utensils }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Service Vendor Supplier Directory</h1>
        <p className="text-muted-foreground">
          Manage service vendors and suppliers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Vendor Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">Vendor Types (select all that apply)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {vendorTypeOptions.map((option) => {
                const IconComponent = option.icon;
                const isChecked = selectedVendorTypes.includes(option.value);
                return (
                  <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={option.value}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedVendorTypes([...selectedVendorTypes, option.value]);
                        } else {
                          setSelectedVendorTypes(selectedVendorTypes.filter(type => type !== option.value));
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
          
          {selectedVendorTypes.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Selected Vendor Types:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedVendorTypes.map(type => (
                  <span key={type} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {vendorTypeOptions.find(opt => opt.value === type)?.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={() => setSelectedVendorTypes([])} 
            variant="outline"
            disabled={selectedVendorTypes.length === 0}
          >
            Clear All Selections
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Profiles ({filteredProfiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProfiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No vendor profiles match your selected criteria.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => {
                const typeOption = vendorTypeOptions.find(opt => opt.value === profile.type);
                const IconComponent = typeOption?.icon || Utensils;
                
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
                        <p className="col-span-2"><strong>Available:</strong> {profile.available_dates}</p>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{profile.description}</p>
                      
                      {profile.specialties.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Specialties:</p>
                          <div className="flex flex-wrap gap-1">
                            {profile.specialties.map((specialty, index) => (
                              <span key={index} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                                {specialty}
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

export default ServiceVendorDirectory;
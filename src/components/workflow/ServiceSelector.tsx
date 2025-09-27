import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Users, Camera, UtensilsCrossed, Music, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VendorSupplier {
  id: string;
  business_name: string;
  contact_name: string | null;
  email: string;
  phone_number: string;
  city: string;
  state: string;
  zip: string;
  vendor_sup_type_id: number;
  created_at: string;
  updated_at: string;
}

interface VendorSupplierType {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface Service {
  id: string;
  category: "vendor" | "rental";
  type: string;
  business_name: string;
  contact_name?: string;
  location: string;
  description: string;
}

interface ServiceSelectorProps {
  onSelectService: (service: Service) => void;
  selectedService: Service | null;
}

// Mock service data - in real app, this would come from Service Vendor Directory and Service Rental Directory tables
const mockServices: Service[] = [
  // Service Vendors
  {
    id: "sv1",
    category: "vendor",
    type: "Catering",
    business_name: "Gourmet Catering Co",
    contact_name: "Maria Rodriguez",
    location: "Austin, TX 78701",
    description: "Full-service catering with customizable menus"
  },
  {
    id: "sv2",
    category: "vendor",
    type: "Photography",
    business_name: "Moments Photography",
    contact_name: "David Lee",
    location: "Seattle, WA 98101",
    description: "Professional event photography and videography"
  },
  {
    id: "sv3",
    category: "vendor",
    type: "Entertainment",
    business_name: "Live Music Events",
    contact_name: "Jessica Smith",
    location: "Nashville, TN 37201",
    description: "Live bands and DJ services for all occasions"
  },
  // Service Rentals
  {
    id: "sr1",
    category: "rental",
    type: "Tables & Chairs",
    business_name: "Party Rental Plus",
    location: "Denver, CO 80201",
    description: "Complete table and seating solutions"
  },
  {
    id: "sr2",
    category: "rental",
    type: "Audio/Visual Equipment",
    business_name: "AV Solutions Rental",
    location: "Atlanta, GA 30301",
    description: "Sound systems, microphones, and projection equipment"
  },
  {
    id: "sr3",
    category: "rental",
    type: "Tents",
    business_name: "Event Tent Rentals",
    location: "Phoenix, AZ 85001",
    description: "Weather protection and outdoor event solutions"
  },
  {
    id: "sr4",
    category: "rental",
    type: "Transportation",
    business_name: "Elite Event Transport",
    location: "Las Vegas, NV 89101",
    description: "Luxury transportation for guests and VIPs"
  }
];

const getServiceIcon = (type: string) => {
  const iconClass = "h-4 w-4";
  switch (type.toLowerCase()) {
    case "catering": return <UtensilsCrossed className={iconClass} />;
    case "photography": return <Camera className={iconClass} />;
    case "entertainment": return <Music className={iconClass} />;
    case "transportation": return <Car className={iconClass} />;
    default: return <Wrench className={iconClass} />;
  }
};

export function ServiceSelector({ onSelectService, selectedService }: ServiceSelectorProps) {
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [activeTab, setActiveTab] = useState("vendor");
  const [vendors, setVendors] = useState<VendorSupplier[]>([]);
  const [vendorTypes, setVendorTypes] = useState<VendorSupplierType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVendorsAndTypes();
  }, []);

  const fetchVendorsAndTypes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch vendor suppliers and types
      const [vendorsResult, typesResult] = await Promise.all([
        supabase.from('serv_vendor_suppliers').select('*'),
        supabase.from('vendor_supplier_types').select('*')
      ]);

      if (vendorsResult.error) throw vendorsResult.error;
      if (typesResult.error) throw typesResult.error;

      setVendors(vendorsResult.data || []);
      setVendorTypes(typesResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Convert vendors to Service format for compatibility
  const convertedVendors: Service[] = vendors.map(vendor => {
    const vendorType = vendorTypes.find(type => type.id === vendor.vendor_sup_type_id);
    const location = `${vendor.city}, ${vendor.state} ${vendor.zip}`.trim();
    return {
      id: vendor.id,
      category: "vendor" as const,
      type: vendorType?.name || "Unknown",
      business_name: vendor.business_name || "Unknown Business",
      contact_name: vendor.contact_name || undefined,
      location: location,
      description: `Email: ${vendor.email} | Phone: ${vendor.phone_number}`
    };
  });

  // Combine with mock rental services for now (rentals tab)
  const allServices = [...convertedVendors, ...mockServices.filter(s => s.category === "rental")];

  const filteredServices = allServices.filter(service => {
    const matchesCategory = service.category === activeTab;
    const matchesLocation = !locationFilter || 
      service.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesType = !typeFilter || service.type.toLowerCase().includes(typeFilter.toLowerCase());
    return matchesCategory && matchesLocation && matchesType;
  });

  const serviceTypes = [...new Set(filteredServices.map(service => service.type))];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Filter by Location</Label>
              <Input
                id="location"
                placeholder="Enter city, state, or ZIP code"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Filter by Type</Label>
              <Input
                id="type"
                placeholder="Enter service type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Service Category Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="vendor">Service Vendors</TabsTrigger>
              <TabsTrigger value="rental">Service Rentals</TabsTrigger>
            </TabsList>

            <TabsContent value="vendor" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading vendor services...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  <p>{error}</p>
                  <Button onClick={fetchVendorsAndTypes} className="mt-2">Try Again</Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Available Vendor Types:</Label>
                    <div className="flex flex-wrap gap-2">
                      {serviceTypes.map((type) => (
                        <Badge key={type} variant="secondary" className="flex items-center gap-1">
                          {getServiceIcon(type)}
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {filteredServices.map((service) => (
                      <Card 
                        key={service.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedService?.id === service.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => onSelectService(service)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-semibold text-sm">{service.business_name}</h4>
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                {getServiceIcon(service.type)}
                                {service.type}
                              </Badge>
                            </div>
                            
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {service.contact_name && (
                                <p className="text-xs"><strong>Contact:</strong> {service.contact_name}</p>
                              )}
                              <p className="text-xs"><strong>Location:</strong> {service.location}</p>
                              <p className="text-xs">{service.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="rental" className="space-y-4">
              <div className="space-y-2">
                <Label>Available Rental Types:</Label>
                <div className="flex flex-wrap gap-2">
                  {serviceTypes.map((type) => (
                    <Badge key={type} variant="secondary" className="flex items-center gap-1">
                      {getServiceIcon(type)}
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredServices.map((service) => (
                  <Card 
                    key={service.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedService?.id === service.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => onSelectService(service)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-sm">{service.business_name}</h4>
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            {getServiceIcon(service.type)}
                            {service.type}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p className="text-xs"><strong>Location:</strong> {service.location}</p>
                          <p className="text-xs">{service.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {filteredServices.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No services found matching your criteria.</p>
              <p className="text-sm">Try adjusting your location filter or switching categories.</p>
            </div>
          )}

          {selectedService && (
            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
              <h4 className="font-semibold text-primary mb-2">Selected Service</h4>
              <div className="text-sm">
                <p><strong>{selectedService.business_name}</strong></p>
                <p>{selectedService.type} ({selectedService.category})</p>
                <p className="text-muted-foreground">{selectedService.location}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Users, Camera, UtensilsCrossed, Music, Car, CheckCircle2, Building, Mail, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { workflowPlannerCopy } from "@/lib/nudges";
import { DirectoryProfileLink } from "@/components/resource-directory/DirectoryProfileLink";

/**
 * Data: `vendor` / `service_rental_buy` (equipment & service partners).
 * External procurement vendors use `suppliers` — see SupplierSelector (next wizard step).
 */

interface VendorSupplier {
  id: string;
  business_name: string;
  contact_name: string | null;
  email: string;
  phone_number?: string | null;
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

interface VendorRental {
  id: string;
  business_name: string;
  contact_name: string | null;
  email: string;
  phone_number?: string | null;
  city: string;
  state: string;
  zip: string;
  created_at: string;
  updated_at: string;
}

interface VendorRentalType {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface VendorRentalAssignment {
  id: number;
  service_rental_buy_id: string;
  vendor_rental_type_id: number;
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
  /** Contact is email-only in the UI (no phone). */
  email?: string;
}

interface ServiceSelectorProps {
  onSelectServiceVendor: (vendorId: string) => void;
  onSelectServiceRental: (rentalId: string) => void;
  selectedServiceVendor: string | null;
  selectedServiceRental: string | null;
}

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

// Helper to get array of types for a service
const getServiceTypesArray = (service: Service) => service.type.split(',').map(t => t.trim());

export function ServiceSelector({ onSelectServiceVendor, onSelectServiceRental, selectedServiceVendor, selectedServiceRental }: ServiceSelectorProps) {
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [activeTab, setActiveTab] = useState("vendor");
  const [vendors, setVendors] = useState<VendorSupplier[]>([]);
  const [vendorTypes, setVendorTypes] = useState<VendorSupplierType[]>([]);
  const [rentals, setRentals] = useState<VendorRental[]>([]);
  const [rentalTypes, setRentalTypes] = useState<VendorRentalType[]>([]);
  const [rentalAssignments, setRentalAssignments] = useState<VendorRentalAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [vendorsResult, vendorTypesResult, rentalsResult, rentalTypesResult, assignmentsResult] = await Promise.all([
        supabase.from('vendor').select('*'),
        supabase.from('vendor_supplier_types').select('*'),
        supabase.from('service_rental_buy').select('*'),
        supabase.from('vendor_rental_types').select('*'),
        supabase.from('service_rental_buy_assignments').select('*')
      ]);

      if (vendorsResult.error) throw vendorsResult.error;
      if (vendorTypesResult.error) throw vendorTypesResult.error;
      if (rentalsResult.error) throw rentalsResult.error;
      if (rentalTypesResult.error) throw rentalTypesResult.error;
      if (assignmentsResult.error) throw assignmentsResult.error;

      setVendors(vendorsResult.data || []);
      setVendorTypes(vendorTypesResult.data || []);
      setRentals(rentalsResult.data || []);
      setRentalTypes(rentalTypesResult.data || []);
      setRentalAssignments(assignmentsResult.data || []);
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
      description: vendor.email?.trim() ? "Contact via email below." : "Add email on file to enable contact.",
      email: vendor.email?.trim() || undefined,
    };
  });

  // Convert rentals to Service format for compatibility
  const convertedRentals: Service[] = rentals.map(rental => {
    // Find all rental types for this rental vendor through assignments
    const rentalTypeIds = rentalAssignments
      .filter(assignment => assignment.service_rental_buy_id === rental.id)
      .map(assignment => assignment.vendor_rental_type_id);
    
    const associatedTypes = rentalTypes
      .filter(type => rentalTypeIds.includes(type.id))
      .map(type => type.name);

    const location = `${rental.city}, ${rental.state} ${rental.zip}`.trim();
    const rentalTypeName = associatedTypes.length > 0 ? associatedTypes.join(", ") : "Rental Services";

    return {
      id: rental.id,
      category: "rental" as const,
      type: rentalTypeName,
      business_name: rental.business_name || "Unknown Business",
      contact_name: rental.contact_name || undefined,
      location: location,
      description: rental.email?.trim() ? "Contact via email below." : "Add email on file to enable contact.",
      email: rental.email?.trim() || undefined,
    };
  });

  // Combine all services
  const allServices = [...convertedVendors, ...convertedRentals];

  const filteredServices = allServices.filter(service => {
    const matchesCategory = service.category === activeTab;
    const matchesLocation = !locationFilter || 
      service.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesType = !typeFilter || service.type.toLowerCase().includes(typeFilter.toLowerCase());
    return matchesCategory && matchesLocation && matchesType;
  });

  const serviceTypes = [...new Set(filteredServices.map(service => service.type))];

  // Get unique rental types for tags
  const uniqueRentalTypes = Array.from(new Set(
    filteredServices
      .filter(service => service.category === 'rental')
      .flatMap(service => service.type.split(',').map(type => type.trim()))
  ));

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
          <Alert className="border-primary/30 bg-primary/5">
            <Info className="h-4 w-4" />
            <AlertTitle>{workflowPlannerCopy.serviceSelectorAlertTitle}</AlertTitle>
            <AlertDescription className="text-sm">{workflowPlannerCopy.serviceSelectorAlertBody}</AlertDescription>
          </Alert>
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
                  <Button onClick={fetchAllData} className="mt-2">Try Again</Button>
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {filteredServices.map((service) => {
                      const isSelected = selectedServiceVendor === service.id;
                      return (
                        <Card
                          key={service.id}
                          className={`cursor-pointer transition-all duration-300 hover:scale-105 border-2 ${
                            isSelected ? 'border-primary shadow-lg' : 'border-border'
                          }`}
                          onClick={() => onSelectServiceVendor(service.id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Building className="h-5 w-5" />
                                  {service.business_name || 'Service'}
                                </CardTitle>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-start flex-wrap gap-2">
                                {getServiceTypesArray(service).map((type, idx) => (
                                  <Badge key={service.id + '-' + idx} variant="outline" className="text-xs flex items-center gap-1">
                                    {getServiceIcon(type)}
                                    {type}
                                  </Badge>
                                ))}
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                {service.contact_name && (
                                  <p className="text-xs">
                                    <strong>Contact:</strong> {service.contact_name}
                                  </p>
                                )}
                                {service.email?.trim() ? (
                                  <div className="flex items-start gap-1 text-xs">
                                    <Mail className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" />
                                    <a
                                      href={`mailto:${service.email.trim()}`}
                                      className="text-primary hover:underline break-all"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {service.email}
                                    </a>
                                  </div>
                                ) : null}
                                <p className="text-xs">
                                  <strong>Location:</strong> {service.location}
                                </p>
                                <p className="text-xs">{service.description}</p>
                                <DirectoryProfileLink kind="vendor" id={service.id} className="text-xs mt-1" />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                className="flex-1"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectServiceVendor(service.id);
                                }}
                              >
                                {isSelected ? "Selected" : "Select Service"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="rental" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading rental services...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  <p>{error}</p>
                  <Button onClick={fetchAllData} className="mt-2">Try Again</Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Available Rental Types:</Label>
                    <div className="flex flex-wrap gap-2">
                      {uniqueRentalTypes.map((type) => (
                        <Badge key={type} variant="secondary" className="flex items-center gap-1">
                          {getServiceIcon(type)}
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {filteredServices.map((service) => {
                      const isSelected = selectedServiceRental === service.id;

                      return (
                        <Card
                          key={service.id}
                          className={`cursor-pointer transition-all duration-300 hover:scale-105 border-2 ${
                            isSelected ? 'border-primary shadow-lg' : 'border-border'
                          }`}
                          onClick={() => onSelectServiceRental(service.id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Building className="h-5 w-5" />
                                  {service.business_name || 'Service'}
                                </CardTitle>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-start flex-wrap gap-2">
                                {getServiceTypesArray(service).map((type, idx) => (
                                  <Badge key={service.id + '-' + idx} variant="outline" className="text-xs flex items-center gap-1">
                                    {getServiceIcon(type)}
                                    {type}
                                  </Badge>
                                ))}
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                {service.contact_name && (
                                  <p className="text-xs">
                                    <strong>Contact:</strong> {service.contact_name}
                                  </p>
                                )}
                                {service.email?.trim() ? (
                                  <div className="flex items-start gap-1 text-xs">
                                    <Mail className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" />
                                    <a
                                      href={`mailto:${service.email.trim()}`}
                                      className="text-primary hover:underline break-all"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {service.email}
                                    </a>
                                  </div>
                                ) : null}
                                <p className="text-xs">
                                  <strong>Location:</strong> {service.location}
                                </p>
                                <p className="text-xs">{service.description}</p>
                                <DirectoryProfileLink kind="service_rental_buy" id={service.id} className="text-xs mt-1" />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                className="flex-1"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectServiceRental(service.id);
                                }}
                              >
                                {isSelected ? "Selected" : "Select Rental"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          {filteredServices.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No services found matching your criteria.</p>
              <p className="text-sm">Try adjusting your location filter or switching categories.</p>
            </div>
          )}

          {(selectedServiceVendor || selectedServiceRental) && (
            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
              <h4 className="font-semibold text-primary mb-2">Selected Services</h4>
              <div className="text-sm space-y-2">
                {selectedServiceVendor && (() => {
                  const vendor = convertedVendors.find(s => s.id === selectedServiceVendor);
                  return vendor ? (
                    <div>
                      <p><strong>Service Vendor:</strong> {vendor.business_name}</p>
                      <p>{vendor.type} | {vendor.location}</p>
                    </div>
                  ) : null;
                })()}
                {selectedServiceRental && (() => {
                  const rental = convertedRentals.find(s => s.id === selectedServiceRental);
                  return rental ? (
                    <div>
                      <p><strong>Service Rental:</strong> {rental.business_name}</p>
                      <p>{rental.type} | {rental.location}</p>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
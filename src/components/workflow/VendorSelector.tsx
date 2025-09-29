import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Vendor {
  id: string;
  vendor_biz_name: string;
  vendor_type: string;
  vendor_contact_name: string;
  vendor_email: string;
  vendor_contact_nbr: string;
  vendor_location: string;
}

interface VendorSelectorProps {
  onSelectVendor: (vendorId: string) => void;
  selectedVendor: string | null;
}

export function VendorSelector({ onSelectVendor, selectedVendor }: VendorSelectorProps) {
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select(`
          *,
          supplier_types(name),
          supplier_categories(name)
        `);

      if (error) {
        console.error('Error fetching suppliers:', error);
      } else {
        // Transform supplier data to vendor format for compatibility
        const transformedData = (data || []).map(supplier => ({
          id: supplier.id,
          vendor_biz_name: supplier.business_name,
          vendor_type: supplier.supplier_types?.name || 'Unknown',
          vendor_contact_name: supplier.contact_name || '',
          vendor_email: supplier.email || '',
          vendor_contact_nbr: supplier.phone_number || '',
          vendor_location: [supplier.city, supplier.state, supplier.zip].filter(Boolean).join(', ')
        }));
        setVendors(transformedData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesLocation = !locationFilter || 
      vendor.vendor_location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesType = !typeFilter || 
      vendor.vendor_type.toLowerCase().includes(typeFilter.toLowerCase());
    return matchesLocation && matchesType;
  });

  const vendorTypes = [...new Set(vendors.map(vendor => vendor.vendor_type))];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Select Vendors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Filter by Location (City, State, ZIP)</Label>
              <Input
                id="location"
                placeholder="Enter city, state, or ZIP code"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-type">Filter by Vendor Type</Label>
              <Input
                id="vendor-type"
                placeholder="Enter vendor type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Available Vendor Types */}
          <div className="space-y-2">
            <Label>Available Vendor Types:</Label>
            <div className="flex flex-wrap gap-2">
              {vendorTypes.map((type) => (
                <Badge 
                  key={type} 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => setTypeFilter(type)}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          {/* Vendor List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Loading vendors...</p>
              </div>
            ) : filteredVendors.map((vendor) => (
              <Card 
                key={vendor.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedVendor === vendor.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onSelectVendor(vendor.id)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-sm">{vendor.vendor_biz_name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {vendor.vendor_type}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {vendor.vendor_location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs">{vendor.vendor_location}</span>
                        </div>
                      )}
                      {vendor.vendor_contact_nbr && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span className="text-xs">{vendor.vendor_contact_nbr}</span>
                        </div>
                      )}
                      {vendor.vendor_email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="text-xs">{vendor.vendor_email}</span>
                        </div>
                      )}
                      {vendor.vendor_contact_name && (
                        <p className="text-xs"><strong>Contact:</strong> {vendor.vendor_contact_name}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!loading && filteredVendors.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No vendors found matching your criteria.</p>
              <p className="text-sm">Try adjusting your location or type filters.</p>
            </div>
          )}

          {selectedVendor && (
            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
              <h4 className="font-semibold text-primary mb-2">Selected Vendor</h4>
              <div className="text-sm">
                {(() => {
                  const vendor = vendors.find(v => v.id === selectedVendor);
                  return vendor ? (
                    <>
                      <p><strong>{vendor.vendor_biz_name}</strong></p>
                      <p>{vendor.vendor_type}</p>
                      <p className="text-muted-foreground">{vendor.vendor_location}</p>
                    </>
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
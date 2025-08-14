import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Building2 } from "lucide-react";

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
  onSelectVendor: (vendor: Vendor) => void;
  selectedVendor: Vendor | null;
}

// Mock vendor data - in real app, this would come from the Vendor Directory table
const mockVendors: Vendor[] = [
  {
    id: "1",
    vendor_biz_name: "Elite Audio Visual",
    vendor_type: "Audio/Visual Equipment",
    vendor_contact_name: "Sarah Johnson",
    vendor_email: "sarah@eliteav.com",
    vendor_contact_nbr: "555-0123",
    vendor_location: "New York, NY 10001"
  },
  {
    id: "2",
    vendor_biz_name: "Perfect Events Photography",
    vendor_type: "Photography",
    vendor_contact_name: "Mike Chen",
    vendor_email: "mike@perfectevents.com",
    vendor_contact_nbr: "555-0124",
    vendor_location: "Los Angeles, CA 90210"
  },
  {
    id: "3",
    vendor_biz_name: "Sound & Lights Co",
    vendor_type: "Lighting & Sound",
    vendor_contact_name: "Jennifer Davis",
    vendor_email: "jen@soundlights.com",
    vendor_contact_nbr: "555-0125",
    vendor_location: "Chicago, IL 60601"
  },
  {
    id: "4",
    vendor_biz_name: "Creative Decor Solutions",
    vendor_type: "Decorations",
    vendor_contact_name: "Robert Kim",
    vendor_email: "robert@creativedecor.com",
    vendor_contact_nbr: "555-0126",
    vendor_location: "Miami, FL 33101"
  }
];

export function VendorSelector({ onSelectVendor, selectedVendor }: VendorSelectorProps) {
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filteredVendors = mockVendors.filter(vendor => {
    const matchesLocation = !locationFilter || 
      vendor.vendor_location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesType = !typeFilter || 
      vendor.vendor_type.toLowerCase().includes(typeFilter.toLowerCase());
    return matchesLocation && matchesType;
  });

  const vendorTypes = [...new Set(mockVendors.map(vendor => vendor.vendor_type))];

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
            {filteredVendors.map((vendor) => (
              <Card 
                key={vendor.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedVendor?.id === vendor.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onSelectVendor(vendor)}
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
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="text-xs">{vendor.vendor_location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span className="text-xs">{vendor.vendor_contact_nbr}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="text-xs">{vendor.vendor_email}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredVendors.length === 0 && (
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
                <p><strong>{selectedVendor.vendor_biz_name}</strong></p>
                <p>{selectedVendor.vendor_type}</p>
                <p className="text-muted-foreground">{selectedVendor.vendor_location}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
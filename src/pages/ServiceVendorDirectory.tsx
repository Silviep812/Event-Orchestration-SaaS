import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChefHat, Camera, Utensils, Cake } from "lucide-react";

const ServiceVendorDirectory = () => {
  const [vendorTypes, setVendorTypes] = useState<any[]>([]);
  const [selectedVendorType, setSelectedVendorType] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendorTypes();
  }, []);

  const fetchVendorTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('Service Vendor Directory')
        .select('*');
      
      if (error) {
        console.error('Error fetching vendor types:', error);
      } else {
        setVendorTypes(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const vendorTypeOptions = [
    { value: "caterer", label: "Caterer", icon: Utensils },
    { value: "chef", label: "Chef", icon: ChefHat },
    { value: "bakery", label: "Bakery", icon: Cake },
    { value: "videographer", label: "Videographer", icon: Camera }
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
          <CardTitle>Select Vendor Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Vendor Type</label>
            <Select value={selectedVendorType} onValueChange={setSelectedVendorType}>
              <SelectTrigger className="w-full bg-background border-border">
                <SelectValue placeholder="Select a vendor type..." />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                {vendorTypeOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className="hover:bg-muted cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <IconComponent size={16} />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          {selectedVendorType && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Selected Vendor Type:</h3>
              <p className="text-sm text-muted-foreground">
                {vendorTypeOptions.find(opt => opt.value === selectedVendorType)?.label}
              </p>
            </div>
          )}

          <Button 
            onClick={() => setSelectedVendorType("")} 
            variant="outline"
            disabled={!selectedVendorType}
          >
            Clear Selection
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {loading ? 'Loading vendor data...' : 'No vendor profiles found. Add vendors to see them here.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceVendorDirectory;
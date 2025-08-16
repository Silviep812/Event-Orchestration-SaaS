import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChefHat, Camera, Utensils, Cake } from "lucide-react";

const ServiceVendorDirectory = () => {
  const [vendorTypes, setVendorTypes] = useState<any[]>([]);
  const [selectedVendorTypes, setSelectedVendorTypes] = useState<string[]>([]);
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
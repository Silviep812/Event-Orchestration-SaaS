import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Truck, ShoppingCart, Store, Building } from "lucide-react";

export default function SupplierDirectory() {
  const [supplierTypes, setSupplierTypes] = useState([]);
  const [selectedSupplierTypes, setSelectedSupplierTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupplierTypes();
  }, []);

  const fetchSupplierTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Supplier Directory')
        .select('*');

      if (error) {
        console.error('Error fetching supplier types:', error);
      } else {
        setSupplierTypes(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const supplierTypeOptions = [
    { value: "distributor", label: "Distributor", icon: Truck },
    { value: "wholesaler", label: "Wholesaler", icon: Package },
    { value: "online_market", label: "Online Market", icon: ShoppingCart },
    { value: "merchandizer", label: "Merchandizer", icon: Store },
    { value: "other", label: "Other", icon: Building },
  ];

  const handleSupplierTypeChange = (value: string, checked: boolean) => {
    if (checked) {
      setSelectedSupplierTypes([...selectedSupplierTypes, value]);
    } else {
      setSelectedSupplierTypes(selectedSupplierTypes.filter(type => type !== value));
    }
  };

  const clearAllSelections = () => {
    setSelectedSupplierTypes([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Supplier Directory</h1>
        <p className="text-muted-foreground">
          Browse and select suppliers for your event needs
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Supplier Types</CardTitle>
          <CardDescription>
            Choose all supplier types that apply to your event requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supplierTypeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={selectedSupplierTypes.includes(option.value)}
                    onCheckedChange={(checked) => 
                      handleSupplierTypeChange(option.value, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={option.value}
                    className="flex items-center space-x-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{option.label}</span>
                  </label>
                </div>
              );
            })}
          </div>

          {selectedSupplierTypes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Selected Types:</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllSelections}
                >
                  Clear All Selections
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSupplierTypes.map((type) => {
                  const option = supplierTypeOptions.find(opt => opt.value === type);
                  return (
                    <Badge key={type} variant="secondary">
                      {option?.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading supplier profiles...</p>
          ) : (
            <p className="text-muted-foreground">
              No supplier profiles found. Supplier profiles will appear here when available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
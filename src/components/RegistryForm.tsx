import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Gift, ShoppingCart, Heart, Package, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { registrySchema } from "@/lib/validation/bookingsValidation";
import { useAuth } from "@/hooks/useAuth";

interface RegistryItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  claimed: number;
}

const RegistryForm = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const registryItems: RegistryItem[] = [
    {
      id: "1",
      name: "Premium Table Settings",
      description: "Elegant dinnerware set for 12 people",
      price: 250,
      quantity: 2,
      claimed: 0
    },
    {
      id: "2",
      name: "Professional Photography Package",
      description: "Full day coverage with photo album",
      price: 500,
      quantity: 1,
      claimed: 0
    },
    {
      id: "3",
      name: "Floral Centerpieces",
      description: "Beautiful arrangements for guest tables",
      price: 150,
      quantity: 8,
      claimed: 3
    },
    {
      id: "4",
      name: "Sound System Rental",
      description: "High-quality audio equipment",
      price: 300,
      quantity: 1,
      claimed: 0
    },
    {
      id: "5",
      name: "Catering Service",
      description: "Gourmet meal service for guests",
      price: 1000,
      quantity: 1,
      claimed: 0
    },
    {
      id: "6",
      name: "Venue Decoration Package",
      description: "Complete venue transformation",
      price: 400,
      quantity: 1,
      claimed: 0
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      if (selectedItems.length === 0) {
        throw new Error("Please select at least one registry item");
      }

      const selectedItemsData = registryItems.filter(item => selectedItems.includes(item.id));

      const validatedData = registrySchema.parse({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        selected_items: selectedItems,
        total_amount: getTotalAmount(),
        message: formData.message || undefined,
      });

      const bookId = `reg_${Date.now()}`;
      const { error: registryError } = await supabase
        .from('registry_submissions')
        .insert([{
          book_id: bookId,
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          selected_items: JSON.parse(JSON.stringify(selectedItemsData)),
          total_amount: validatedData.total_amount,
          message: validatedData.message,
        }]);

      if (registryError) throw registryError;

      // Update Bookings Directory if user is authenticated
      if (user) {
        const { error: directoryError } = await supabase
          .from('Bookings Directory')
          .upsert({
            book_id: `booking_${user.id}`,
            user_id: user.id,
            registry: selectedItems,
          }, {
            onConflict: 'book_id',
          });

        if (directoryError) console.error('Directory update error:', directoryError);
      }

      toast({
        title: "Registry Contribution Received",
        description: `Thank you for contributing to ${selectedItems.length} item(s)!`,
      });

      setSelectedItems([]);
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: ""
      });
    } catch (error: any) {
      if (error.errors) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
        toast({
          title: "Validation Error",
          description: "Please check the form and try again",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Submission Failed",
          description: error.message || "An error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (errors[e.target.name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[e.target.name];
        return newErrors;
      });
    }
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getTotalAmount = () => {
    return registryItems
      .filter(item => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + item.price, 0);
  };

  return (
    <Card className="max-w-4xl mx-auto border-primary/20 shadow-lg">
      <CardHeader className="space-y-4 bg-gradient-to-br from-primary/5 to-primary/10 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Gift className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Event Registry</CardTitle>
            <CardDescription className="text-base">Help make this event special by contributing to our registry</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 md:p-8">
        <div className="mb-8">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary" />
            Available Registry Items
          </h3>
          
          <div className="grid gap-4">
            {registryItems.map((item) => {
              const isSelected = selectedItems.includes(item.id);
              const isFullyClaimed = item.claimed >= item.quantity;
              const available = item.quantity - item.claimed;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : isFullyClaimed
                      ? "border-border bg-muted/30 opacity-60"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      id={item.id}
                      checked={isSelected}
                      onCheckedChange={() => toggleItem(item.id)}
                      disabled={isFullyClaimed}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={item.id}
                        className={`cursor-pointer ${isFullyClaimed ? "cursor-not-allowed" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h4 className="font-semibold text-base">{item.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-primary">${item.price}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {isFullyClaimed ? (
                                <span className="text-destructive">Fully Claimed</span>
                              ) : (
                                <span>{available} of {item.quantity} available</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedItems.length > 0 && (
          <div className="mb-8 p-6 bg-primary/10 rounded-lg border-2 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <span className="font-semibold">Selected Items: {selectedItems.length}</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Contribution</p>
                <p className="text-2xl font-bold text-primary">${getTotalAmount()}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
                className="border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="border-border"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={handleChange}
                className="border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Personal Message (Optional)
            </Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Share your wishes or a personal message..."
              value={formData.message}
              onChange={handleChange}
              className="min-h-[100px] border-border resize-none"
            />
          </div>

          {/* Error Messages */}
          {Object.keys(errors).length > 0 && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium mb-2">Please fix the following errors:</p>
              <ul className="list-disc list-inside text-sm text-destructive space-y-1">
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || selectedItems.length === 0}
              className="flex-1 h-12 text-base font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5 mr-2" />
                  Confirm Contribution
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              disabled={isSubmitting}
              className="flex-1 h-12 text-base"
              onClick={() => {
                setSelectedItems([]);
                setFormData({
                  name: "",
                  email: "",
                  phone: "",
                  message: ""
                });
                setErrors({});
              }}
            >
              Clear Selection
            </Button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Your contribution helps make this event memorable. After submission, 
            you'll receive payment instructions and confirmation details via email.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RegistryForm;

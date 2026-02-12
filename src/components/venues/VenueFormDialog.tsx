import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface VenueType {
  id: number | string;
  name: string;
}

interface VenueFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueTypes: VenueType[];
  onVenueAdded: (venue: any) => void;
}

const emptyForm = {
  business_name: '',
  contact_name: '',
  email: '',
  phone_number: '',
  city: '',
  state: '',
  zip: '',
  capacity: '',
  venue_type_id: '',
  amenities: '',
};

export const VenueFormDialog = ({ open, onOpenChange, venueTypes, onVenueAdded }: VenueFormDialogProps) => {
  const [newVenue, setNewVenue] = useState({ ...emptyForm });
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to add a venue', variant: 'destructive' });
      return;
    }
    if (!newVenue.business_name.trim()) {
      toast({ title: 'Error', description: 'Business name is required', variant: 'destructive' });
      return;
    }

    const venueData: any = {
      business_name: newVenue.business_name.trim(),
      contact_name: newVenue.contact_name.trim() || null,
      email: newVenue.email.trim() || null,
      phone_number: newVenue.phone_number.trim() || null,
      city: newVenue.city.trim() || null,
      state: newVenue.state.trim() || null,
      zip: newVenue.zip.trim() || null,
      capacity: newVenue.capacity ? parseInt(newVenue.capacity) : null,
      venue_type_id: newVenue.venue_type_id ? Number(newVenue.venue_type_id) : null,
      user_id: user.id,
      amenities: newVenue.amenities
        ? newVenue.amenities.split(',').map(s => s.trim()).filter(Boolean)
        : [],
    };

    const { data, error } = await supabase.from('venue_profiles').insert(venueData).select().single();
    if (error) {
      toast({ title: 'Error', description: 'Failed to add venue', variant: 'destructive' });
    } else {
      onVenueAdded(data);
      onOpenChange(false);
      setNewVenue({ ...emptyForm });
      toast({ title: 'Venue Added', description: 'Your venue has been added.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Venue</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Business Name *</Label>
            <Input value={newVenue.business_name} onChange={e => setNewVenue({ ...newVenue, business_name: e.target.value })} />
          </div>
          <div>
            <Label>Contact Name</Label>
            <Input value={newVenue.contact_name} onChange={e => setNewVenue({ ...newVenue, contact_name: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={newVenue.email} onChange={e => setNewVenue({ ...newVenue, email: e.target.value })} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={newVenue.phone_number} onChange={e => setNewVenue({ ...newVenue, phone_number: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>City</Label>
              <Input value={newVenue.city} onChange={e => setNewVenue({ ...newVenue, city: e.target.value })} />
            </div>
            <div>
              <Label>State</Label>
              <Input value={newVenue.state} onChange={e => setNewVenue({ ...newVenue, state: e.target.value })} />
            </div>
            <div>
              <Label>Zip</Label>
              <Input value={newVenue.zip} onChange={e => setNewVenue({ ...newVenue, zip: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Capacity</Label>
            <Input type="number" value={newVenue.capacity} onChange={e => setNewVenue({ ...newVenue, capacity: e.target.value })} />
          </div>
          <div>
            <Label>Amenities (comma-separated)</Label>
            <Input
              placeholder="e.g. WiFi, Parking, Stage"
              value={newVenue.amenities}
              onChange={e => setNewVenue({ ...newVenue, amenities: e.target.value })}
            />
          </div>
          <div>
            <Label>Venue Type</Label>
            <Select value={newVenue.venue_type_id} onValueChange={value => setNewVenue({ ...newVenue, venue_type_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {venueTypes.map(t => (
                  <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" className="w-full" onClick={handleSubmit}>
            Add Venue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

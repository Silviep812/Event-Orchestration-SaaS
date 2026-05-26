import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  TypeSelectWithOther,
  OTHER_VALUE,
  type TypeOption,
} from "./TypeSelectWithOther";

interface AddDirectoryEntryDialogProps {
  /** Display title for the dialog (e.g. "Add Venue"). */
  title: string;
  /** Supabase table name to insert into. */
  table: string;
  /** Column name on the entry table holding the type FK (e.g. "venue_type_id"). */
  typeColumn: string;
  /** Column for the manual entry text (e.g. "custom_type" or "custom_category"). */
  customColumn: string;
  /** Type options sourced from the directory page. */
  typeOptions: TypeOption[];
  /** Label for the type dropdown (e.g. "Venue Type"). */
  typeLabel: string;
  /** True if type FK is numeric; false for uuid/string FKs. */
  numericTypeId?: boolean;
  /** Optional capacity field (for Venue / Transportation). */
  showCapacity?: boolean;
  /** Pass true if the table has a user_id column to scope ownership. */
  setUserId?: boolean;
  /** Called after a successful insert so the parent page can refetch. */
  onCreated: () => void;
}

export function AddDirectoryEntryDialog({
  title,
  table,
  typeColumn,
  customColumn,
  typeOptions,
  typeLabel,
  numericTypeId = true,
  showCapacity = false,
  setUserId = false,
  onCreated,
}: AddDirectoryEntryDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    contact_name: "",
    email: "",
    phone_number: "",
    city: "",
    state: "",
    zip: "",
    capacity: "",
    type: "",
    custom: "",
  });

  const reset = () =>
    setForm({
      business_name: "",
      contact_name: "",
      email: "",
      phone_number: "",
      city: "",
      state: "",
      zip: "",
      capacity: "",
      type: "",
      custom: "",
    });

  const handleSave = async () => {
    if (!form.business_name.trim()) {
      toast({
        title: "Business name required",
        description: "Please enter a business name.",
        variant: "destructive",
      });
      return;
    }
    if (form.type === OTHER_VALUE && !form.custom.trim()) {
      toast({
        title: "Custom type required",
        description: "Please enter a value for the custom type.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        business_name: form.business_name.trim(),
        contact_name: form.contact_name.trim() || null,
        email: form.email.trim() || null,
        phone_number: form.phone_number.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        zip: form.zip.trim() || null,
      };

      if (showCapacity && form.capacity && !Number.isNaN(Number(form.capacity))) {
        payload.capacity = Number(form.capacity);
      }

      if (form.type === OTHER_VALUE) {
        payload[typeColumn] = null;
        payload[customColumn] = form.custom.trim();
      } else if (form.type) {
        payload[typeColumn] = numericTypeId ? Number(form.type) : form.type;
        payload[customColumn] = null;
      }

      if (setUserId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "Sign in required",
            description: "You must be signed in to add an entry.",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
        payload.user_id = user.id;
      }

      const { error } = await (supabase.from(table as any) as any).insert(payload);

      if (error) {
        toast({
          title: "Could not add entry",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Entry added", description: `${form.business_name} has been added.` });
        reset();
        setOpen(false);
        onCreated();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Fill in the details below. Choose “Other” in the type dropdown to enter a
            custom value.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Business Name *</Label>
            <Input
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              maxLength={120}
            />
          </div>
          <div>
            <Label>Contact Name</Label>
            <Input
              value={form.contact_name}
              onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              maxLength={120}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={255}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                maxLength={40}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
            <div>
              <Label>ZIP</Label>
              <Input
                value={form.zip}
                onChange={(e) => setForm({ ...form, zip: e.target.value })}
              />
            </div>
          </div>
          {showCapacity ? (
            <div>
              <Label>Capacity</Label>
              <Input
                type="number"
                min={0}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </div>
          ) : null}
          <TypeSelectWithOther
            label={typeLabel}
            options={typeOptions}
            value={form.type}
            onValueChange={(v) => setForm({ ...form, type: v, custom: "" })}
            customValue={form.custom}
            onCustomChange={(v) => setForm({ ...form, custom: v })}
          />
          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Entry"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

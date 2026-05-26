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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  SUPPLIER_BUSINESS_CATEGORIES,
  SUPPLIER_OTHER_CATEGORY,
  supplierCategoryByName,
} from "@/lib/supplierBusinessCategories";

const OTHER = "__other__";

interface Props {
  onCreated: () => void;
}

/**
 * Add External Vendor dialog wired to Business Rules categories + types.
 * Saves selections as free-text into `suppliers.custom_category` and
 * `suppliers.custom_type`; FK columns are left null.
 */
export function AddSupplierEntryDialog({ onCreated }: Props) {
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
    category: "",
    customCategory: "",
    type: "",
    customType: "",
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
      category: "",
      customCategory: "",
      type: "",
      customType: "",
    });

  const isOtherCategory = form.category === OTHER;
  const selectedCat = supplierCategoryByName(form.category);
  const alwaysCustomType = selectedCat?.alwaysCustomType;
  const isOtherType = form.type === OTHER || alwaysCustomType === true;

  const handleSave = async () => {
    if (!form.business_name.trim()) {
      toast({
        title: "Business name required",
        description: "Please enter a business name.",
        variant: "destructive",
      });
      return;
    }
    if (!form.category) {
      toast({
        title: "Category required",
        description: "Please choose a category.",
        variant: "destructive",
      });
      return;
    }
    if (isOtherCategory && !form.customCategory.trim()) {
      toast({
        title: "Custom category required",
        description: "Please enter a custom category name.",
        variant: "destructive",
      });
      return;
    }
    if (isOtherType && !form.customType.trim()) {
      toast({
        title: "Custom type required",
        description: "Please enter a custom type.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
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

      const categoryName = isOtherCategory
        ? form.customCategory.trim()
        : form.category;
      const typeName = isOtherType
        ? form.customType.trim()
        : form.type;

      const payload: Record<string, unknown> = {
        business_name: form.business_name.trim(),
        contact_name: form.contact_name.trim() || null,
        email: form.email.trim() || null,
        phone_number: form.phone_number.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        zip: form.zip.trim() || null,
        category_id: null,
        type_id: null,
        custom_category: categoryName || null,
        custom_type: typeName || null,
      };

      const { error } = await (supabase.from("suppliers" as any) as any).insert(payload);
      if (error) {
        toast({
          title: "Could not add vendor",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Vendor added",
          description: `${form.business_name} has been added.`,
        });
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
          <DialogTitle>Add External Vendor</DialogTitle>
          <DialogDescription>
            Choose a Business Rules category and type. Pick "Other" in either
            dropdown to enter a custom value.
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

          <div className="space-y-2">
            <Label>Category *</Label>
            <Select
              value={form.category || undefined}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  category: v,
                  customCategory: "",
                  type: "",
                  customType: "",
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {SUPPLIER_BUSINESS_CATEGORIES.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER}>{SUPPLIER_OTHER_CATEGORY.name}…</SelectItem>
              </SelectContent>
            </Select>
            {isOtherCategory ? (
              <Input
                autoFocus
                placeholder="Enter custom category"
                value={form.customCategory}
                onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
                maxLength={100}
              />
            ) : null}
          </div>

          {form.category ? (
            <div className="space-y-2">
              <Label>Type{alwaysCustomType ? "" : " *"}</Label>
              {isOtherCategory ? (
                <Input
                  placeholder="Enter custom type"
                  value={form.customType}
                  onChange={(e) => setForm({ ...form, customType: e.target.value })}
                  maxLength={100}
                />
              ) : alwaysCustomType ? (
                <Input
                  placeholder="Enter specialty type"
                  value={form.customType}
                  onChange={(e) => setForm({ ...form, customType: e.target.value })}
                  maxLength={100}
                />
              ) : (
                <>
                  <Select
                    value={form.type || undefined}
                    onValueChange={(v) =>
                      setForm({ ...form, type: v, customType: "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCat?.types.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                      <SelectItem value={OTHER}>Other…</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.type === OTHER ? (
                    <Input
                      placeholder="Enter custom type"
                      value={form.customType}
                      onChange={(e) =>
                        setForm({ ...form, customType: e.target.value })
                      }
                      maxLength={100}
                    />
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Entry"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

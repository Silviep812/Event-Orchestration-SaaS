import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const OTHER_VALUE = "__other__";

export interface TypeOption {
  id: string | number;
  name: string;
}

interface Props {
  label: string;
  options: TypeOption[];
  /** Selected option id as a string, or OTHER_VALUE, or "" */
  value: string;
  onValueChange: (v: string) => void;
  customValue: string;
  onCustomChange: (v: string) => void;
  customPlaceholder?: string;
  placeholder?: string;
}

/**
 * Select dropdown with a pinned "Other…" option that reveals a free-text
 * input for a manual entry. Used by every resource directory add-entry form.
 */
export function TypeSelectWithOther({
  label,
  options,
  value,
  onValueChange,
  customValue,
  onCustomChange,
  customPlaceholder = "Enter custom type",
  placeholder = "Select type",
}: Props) {
  const isOther = value === OTHER_VALUE;
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value || undefined} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={String(opt.id)} value={String(opt.id)}>
              {opt.name}
            </SelectItem>
          ))}
          <SelectItem value={OTHER_VALUE}>Other…</SelectItem>
        </SelectContent>
      </Select>
      {isOther ? (
        <Input
          autoFocus
          placeholder={customPlaceholder}
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          maxLength={100}
        />
      ) : null}
    </div>
  );
}

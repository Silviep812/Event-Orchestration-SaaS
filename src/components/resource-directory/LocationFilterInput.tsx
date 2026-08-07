import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MapPin } from "lucide-react";

export type LocationBearingProfile = {
  city?: string | null;
  state?: string | null;
  zip?: string | number | null;
};

/**
 * Collect the distinct city / state / ZIP values present in a directory, so the filter can offer
 * real choices. Acceptance testing asked to "enable filter searches for all Locations in
 * resources" — the directories only had a free-text box, which meant a planner had to already know
 * what a location was called before they could filter by it.
 */
export function collectLocationOptions(profiles: LocationBearingProfile[]): string[] {
  const byKey = new Map<string, string>();
  for (const p of profiles) {
    const parts = [p.city, p.state, p.zip == null ? "" : String(p.zip)];
    const combined = parts.map((v) => String(v ?? "").trim()).filter(Boolean);
    if (combined.length === 0) continue;

    // Offer the full "City, ST" label plus each component, so either kind of search works.
    const candidates = [combined.slice(0, 2).join(", "), ...combined];
    for (const raw of candidates) {
      const value = raw.trim();
      if (!value) continue;
      const key = value.toLowerCase();
      if (!byKey.has(key)) byKey.set(key, value);
    }
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
}

/** True when a profile matches a free-text or selected location filter. */
export function matchesLocationFilter(profile: LocationBearingProfile, filter: string): boolean {
  const q = filter.trim().toLowerCase();
  if (!q) return true;
  const haystack = [profile.city, profile.state, profile.zip == null ? "" : String(profile.zip)]
    .map((v) => String(v ?? "").toLowerCase())
    .join(" ");
  // "City, ST" selections arrive as one string; every part must be present.
  return q
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .every((part) => haystack.includes(part));
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label?: string;
  id?: string;
  placeholder?: string;
};

/**
 * Location filter that is both searchable and free-text: type to narrow, or pick one of the
 * locations actually recorded in this directory.
 */
export function LocationFilterInput({
  value,
  onChange,
  options,
  label = "Filter by Location",
  id = "location-filter",
  placeholder = "All locations",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className={`truncate ${value ? "" : "text-muted-foreground"}`}>{value || placeholder}</span>
            <MapPin className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search city, state, or ZIP…"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>
                {query.trim() ? (
                  <button
                    type="button"
                    className="w-full px-2 py-1.5 text-left text-sm hover:underline"
                    onClick={() => {
                      onChange(query.trim());
                      setOpen(false);
                    }}
                  >
                    Filter by “{query.trim()}”
                  </button>
                ) : (
                  "No locations recorded yet."
                )}
              </CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="__all__"
                  onSelect={() => {
                    onChange("");
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  All locations
                </CommandItem>
                {visible.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => {
                      onChange(option);
                      setOpen(false);
                    }}
                  >
                    {option}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

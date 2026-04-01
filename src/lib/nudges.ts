import type { Database } from "@/integrations/supabase/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export type Nudge = { id: string; message: string; variant?: "default" | "destructive" };

export function computeEventNudges(event: EventRow | null): Nudge[] {
  if (!event) return [];
  const out: Nudge[] = [];
  if (!event.venue?.trim()) {
    out.push({
      id: "venue",
      message: "Add a venue to unlock timeline scheduling.",
    });
  }
  if (event.status !== "confirmed") {
    const start = event.start_date ? new Date(event.start_date) : null;
    if (start) {
      const days = Math.ceil((start.getTime() - Date.now()) / 86400000);
      if (days <= 2 && days >= 0) {
        out.push({
          id: "confirm",
          message: "Your event is soon — review and confirm your summary.",
        });
      }
    }
  }
  return out;
}

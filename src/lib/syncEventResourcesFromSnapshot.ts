import { supabase } from "@/integrations/supabase/client";

export type EventResourceSyncSnapshot = {
  id: string;
  venue?: string | null;
  location?: string | null;
};

/**
 * Keeps `resources` rows aligned when event venue or location changes.
 * Mirrors Manage Event `syncDetailsToResources` venue + location paths without UI toasts.
 */
export async function syncEventResourcesFromSnapshot(event: EventResourceSyncSnapshot): Promise<void> {
  if (!event.id) return;

  try {
    const { data: categories, error: catError } = await supabase.from("resource_categories").select("id, name");
    if (catError || !categories?.length) {
      console.warn("syncEventResourcesFromSnapshot: categories", catError?.message);
      return;
    }

    const venueCategory = categories.find((c) => c.name.toLowerCase().includes("venue"));
    const { data: statusAvailable, error: statusError } = await supabase
      .from("resource_status")
      .select("id")
      .ilike("name", "%available%")
      .maybeSingle();

    if (statusError) {
      console.warn("syncEventResourcesFromSnapshot: resource_status", statusError.message);
    }

    if (event.venue && venueCategory) {
      const { data: existingVenue, error: venueError } = await supabase
        .from("resources")
        .select("id")
        .eq("event_id", event.id)
        .eq("category_id", venueCategory.id)
        .maybeSingle();

      if (venueError) {
        console.warn("syncEventResourcesFromSnapshot: venue lookup", venueError.message);
      } else if (!existingVenue) {
        const { error: insertError } = await supabase.from("resources").insert({
          name: event.venue,
          category_id: venueCategory.id,
          status_id: statusAvailable?.id ?? 1,
          location: event.location || "",
          allocated: 1,
          total: 1,
          event_id: event.id,
        });
        if (insertError) console.warn("syncEventResourcesFromSnapshot: venue insert", insertError.message);
      } else {
        const { error: updateError } = await supabase
          .from("resources")
          .update({
            name: event.venue,
            location: event.location || "",
          })
          .eq("id", existingVenue.id);
        if (updateError) console.warn("syncEventResourcesFromSnapshot: venue update", updateError.message);
      }
    }

    if (event.location) {
      const { error: updateError } = await supabase
        .from("resources")
        .update({ location: event.location })
        .eq("event_id", event.id);
      if (updateError) console.warn("syncEventResourcesFromSnapshot: bulk location", updateError.message);
    }
  } catch (e) {
    console.warn("syncEventResourcesFromSnapshot:", e);
  }
}

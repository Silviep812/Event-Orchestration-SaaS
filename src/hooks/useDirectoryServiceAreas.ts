import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { LocationBearingProfile } from "@/components/resource-directory/LocationFilterInput";

export type DirectoryServiceAreaKey =
  | "venue"
  | "hospitality"
  | "service_vendor"
  | "service_rental"
  | "transportation"
  | "entertainment"
  | "external_vendor";

type ServiceAreaRow = LocationBearingProfile & {
  region: string | null;
};

/**
 * Coverage is deliberately separate from directory profiles. It lets a planner search the
 * service regions IEP supports without representing a placeholder as a real provider.
 */
export function useDirectoryServiceAreas(directoryKey: DirectoryServiceAreaKey): ServiceAreaRow[] {
  const [areas, setAreas] = useState<ServiceAreaRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      // Table is not present in the generated Supabase types yet; cast per project convention.
      const { data, error } = await (supabase as any)
        .from("directory_service_areas")
        .select("city, state, region")
        .eq("directory_key", directoryKey)
        .eq("is_active", true)
        .order("state")
        .order("city");

      if (cancelled) return;
      if (error) {
        setAreas([]);
        return;
      }
      setAreas((data ?? []) as ServiceAreaRow[]);
    })();

    return () => {
      cancelled = true;
    };
  }, [directoryKey]);

  return useMemo(() => areas, [areas]);
}

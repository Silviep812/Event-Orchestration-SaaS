import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** True when the signed-in user owns at least one non-archived event (Event Plan Report / owner-only UI). */
export function useOwnsActiveEvents(): boolean {
  const { user } = useAuth();
  const [owns, setOwns] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setOwns(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { count, error } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("archived", false);
      if (cancelled) return;
      if (error) {
        console.warn("useOwnsActiveEvents:", error.message);
        setOwns(false);
        return;
      }
      setOwns((count ?? 0) > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return owns;
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/lib/permissions";

/**
 * Event owner or coordinator/admin may approve change requests (aligned with `cm_cr_update_coordinator` RLS).
 */
export function useEventApprovalRights(eventId: string | null | undefined) {
  const { user } = useAuth();
  const { hasMinPermission, loading: permLoading } = usePermissions();
  const [isEventOwner, setIsEventOwner] = useState(false);
  const [ownerLoading, setOwnerLoading] = useState(true);

  useEffect(() => {
    if (!eventId || !user?.id) {
      setIsEventOwner(false);
      setOwnerLoading(false);
      return;
    }
    let cancelled = false;
    setOwnerLoading(true);
    void (async () => {
      const { data, error } = await supabase.from("events").select("user_id").eq("id", eventId).maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setIsEventOwner(false);
      } else {
        setIsEventOwner(data.user_id === user.id);
      }
      setOwnerLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, user?.id]);

  const canApproveChangeRequests =
    Boolean(eventId) && (hasMinPermission("coordinator") || isEventOwner);

  return {
    canApproveChangeRequests,
    loading: permLoading || ownerLoading,
    isEventOwner,
  };
}

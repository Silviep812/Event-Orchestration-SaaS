import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  getCreateEventEntryPath,
  CREATE_EVENT_PATH_RETURNING,
} from "@/lib/createEventEntryPath";

/** Resolves where “Create event” / Add event should go for the signed-in user. */
export function useCreateEventEntryPath() {
  const { user } = useAuth();
  const [path, setPath] = useState(CREATE_EVENT_PATH_RETURNING);

  useEffect(() => {
    if (!user?.id) {
      setPath(CREATE_EVENT_PATH_RETURNING);
      return;
    }
    void getCreateEventEntryPath(supabase).then(setPath);
  }, [user?.id]);

  return path;
}

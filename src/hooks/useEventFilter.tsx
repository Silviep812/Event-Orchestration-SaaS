import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Event {
  id: string;
  title: string;
  start_date?: string;
}

export function useEventFilter() {
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>("all");
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const { user } = useAuth();

  const fetchUserEvents = async () => {
    if (!user) return;
    
    setEventsLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, start_date')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserEvents();
  }, [user]);

  const applyEventFilter = (query: any, eventId?: string) => {
    if (eventId) {
      return query.eq('event_id', eventId);
    } else if (selectedEventFilter !== "all") {
      return query.eq('event_id', selectedEventFilter);
    }
    return query;
  };

  return {
    selectedEventFilter,
    setSelectedEventFilter,
    events,
    eventsLoading,
    applyEventFilter
  };
}
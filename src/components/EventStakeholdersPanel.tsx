import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users } from "lucide-react";

type Row = {
  user_id: string;
  role: string | null;
  display_name: string | null;
  kind: "organizer" | "member";
};

interface EventStakeholdersPanelProps {
  eventId: string;
}

/**
 * Event owner plus `cm_event_members` — maps the matrix “manage user / stakeholders” item to explicit CM membership.
 */
export function EventStakeholdersPanel({ eventId }: EventStakeholdersPanelProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: ev, error: evErr } = await supabase
        .from("events")
        .select("user_id, title")
        .eq("id", eventId)
        .maybeSingle();
      if (evErr) throw evErr;

      const { data: members, error: mErr } = await supabase
        .from("cm_event_members")
        .select("user_id, role")
        .eq("event_id", eventId);
      if (mErr) throw mErr;

      const ids = new Set<string>();
      if (ev?.user_id) ids.add(ev.user_id);
      (members || []).forEach((m) => {
        if (m.user_id) ids.add(m.user_id);
      });

      let nameMap = new Map<string, string | null>();
      if (ids.size > 0) {
        const { data: prof, error: pErr } = await supabase
          .from("user_profiles_teammate_view")
          .select("user_id, display_name")
          .in("user_id", [...ids]);
        if (!pErr && prof) {
          nameMap = new Map(prof.map((p) => [p.user_id, p.display_name]));
        }
      }

      const out: Row[] = [];
      if (ev?.user_id) {
        out.push({
          user_id: ev.user_id,
          role: "Organizer",
          display_name: nameMap.get(ev.user_id) ?? null,
          kind: "organizer",
        });
      }
      for (const m of members || []) {
        if (!m.user_id || m.user_id === ev?.user_id) continue;
        out.push({
          user_id: m.user_id,
          role: m.role || "Member",
          display_name: nameMap.get(m.user_id) ?? null,
          kind: "member",
        });
      }
      setRows(out);
    } catch (e) {
      console.warn("EventStakeholdersPanel:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Stakeholders &amp; event members
        </CardTitle>
        <CardDescription>
          Organizer (event owner) and CM event members for this event. Assign roles under <strong>Team access</strong>{" "}
          below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading stakeholders…
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No organizer or CM members found for this event.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li
                key={`${r.kind}-${r.user_id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.display_name || `User ${r.user_id.slice(0, 8)}…`}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate">{r.user_id}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={r.kind === "organizer" ? "default" : "secondary"}>{r.role}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ListChecks, Plus, Trash2 } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

export type ChecklistItem = { id: string; text: string; done: boolean };

function parseItems(raw: Json | undefined): ChecklistItem[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return [];
  return raw.map((x, i) => {
    if (typeof x === "object" && x !== null && "text" in x) {
      const o = x as Record<string, unknown>;
      return {
        id: String(o.id ?? `i-${i}`),
        text: String(o.text ?? ""),
        done: Boolean(o.done),
      };
    }
    if (typeof x === "string") {
      return { id: `i-${i}`, text: x, done: false };
    }
    return { id: `i-${i}`, text: "", done: false };
  });
}

function toJson(items: ChecklistItem[]): Json {
  return items.map(({ id, text, done }) => ({ id, text, done }));
}

type CheckListRow = {
  id: string;
  event_id: string;
  resource_type: string;
  resource_id: string;
  title: string;
  items: Json;
  created_at: string;
  updated_at: string;
};

interface EventChecklistsProps {
  eventId: string;
}

export function EventChecklists({ eventId }: EventChecklistsProps) {
  const { toast } = useToast();
  const [rows, setRows] = useState<CheckListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemText, setNewItemText] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("check_lists")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setRows((data as CheckListRow[]) || []);
    } catch (e) {
      console.error(e);
      toast({
        title: "Could not load checklists",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const addChecklist = async () => {
    try {
      const { data, error } = await supabase
        .from("check_lists")
        .insert({
          event_id: eventId,
          resource_type: "event",
          resource_id: eventId,
          title: "New checklist",
          items: [] as unknown as Json,
        })
        .select("*")
        .single();
      if (error) throw error;
      if (data) setRows((prev) => [...prev, data as CheckListRow]);
      toast({ title: "Checklist added" });
    } catch (e) {
      toast({
        title: "Could not create checklist",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    }
  };

  const saveTitle = async (id: string, title: string) => {
    try {
      const { error } = await supabase.from("check_lists").update({ title: title.trim() || "Untitled" }).eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, title: title.trim() || "Untitled" } : r)));
    } catch (e) {
      toast({
        title: "Could not save title",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    }
  };

  const persistItems = async (id: string, items: ChecklistItem[]) => {
    const { error } = await supabase.from("check_lists").update({ items: toJson(items) as Json }).eq("id", id);
    if (error) throw error;
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, items: toJson(items) as Json } : r)));
  };

  const toggleItem = async (rowId: string, itemId: string, items: ChecklistItem[]) => {
    const next = items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it));
    try {
      await persistItems(rowId, next);
    } catch (e) {
      toast({
        title: "Could not update item",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    }
  };

  const addLineItem = async (rowId: string, current: ChecklistItem[]) => {
    const text = (newItemText[rowId] || "").trim();
    if (!text) return;
    const next: ChecklistItem[] = [
      ...current,
      { id: crypto.randomUUID(), text, done: false },
    ];
    try {
      await persistItems(rowId, next);
      setNewItemText((prev) => ({ ...prev, [rowId]: "" }));
    } catch (e) {
      toast({
        title: "Could not add line",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    }
  };

  const removeLineItem = async (rowId: string, itemId: string, items: ChecklistItem[]) => {
    const next = items.filter((it) => it.id !== itemId);
    try {
      await persistItems(rowId, next);
    } catch (e) {
      toast({
        title: "Could not remove item",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    }
  };

  const deleteChecklist = async (id: string) => {
    if (!window.confirm("Delete this checklist?")) return;
    try {
      const { error } = await supabase.from("check_lists").delete().eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Checklist removed" });
    } catch (e) {
      toast({
        title: "Could not delete",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">Loading checklists…</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ListChecks className="h-4 w-4" />
          <span>Planning checklists for this event (stored per event).</span>
        </div>
        <Button type="button" size="sm" onClick={() => void addChecklist()}>
          <Plus className="h-4 w-4 mr-1" />
          Add checklist
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No checklists yet. Click &quot;Add checklist&quot; to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => {
            const items = parseItems(row.items);
            const draftLine = (newItemText[row.id] || "").trim();
            return (
              <Card key={row.id} className="shadow-elegant border-0 bg-gradient-subtle">
                <CardHeader className="pb-2 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Input
                      className="font-semibold text-base flex-1"
                      value={row.title}
                      onChange={(e) =>
                        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, title: e.target.value } : r)))
                      }
                      onBlur={() => void saveTitle(row.id, row.title)}
                      aria-label="Checklist title"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => void deleteChecklist(row.id)}
                      aria-label="Delete checklist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2">
                    {items.map((it) => (
                      <li key={it.id} className="flex items-start gap-2">
                        <Checkbox
                          id={`${row.id}-${it.id}`}
                          checked={it.done}
                          onCheckedChange={() => void toggleItem(row.id, it.id, items)}
                          className="mt-1"
                        />
                        <label htmlFor={`${row.id}-${it.id}`} className={`text-sm flex-1 ${it.done ? "line-through text-muted-foreground" : ""}`}>
                          {it.text || "(empty)"}
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => void removeLineItem(row.id, it.id, items)}
                          aria-label="Remove line"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="New line…"
                      value={newItemText[row.id] || ""}
                      onChange={(e) => setNewItemText((prev) => ({ ...prev, [row.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (draftLine) void addLineItem(row.id, items);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={!draftLine}
                      onClick={() => void addLineItem(row.id, items)}
                    >
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

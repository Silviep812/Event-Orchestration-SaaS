import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageSquare, Send } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";
import { isCommentsDiscussionInfraMissing, plannerCommentsToastDescription } from "@/lib/nudges";
import { resolveAuthorAvatarUrlForInsert, resolveAuthorDisplayNameForInsert } from "@/lib/discussionAuthor";

type Row = {
  id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  entity_type: string;
  entity_id: string;
  entity_title: string;
  created_at: string;
  author_display_name?: string | null;
};

export interface TaskDiscussionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | null;
  taskTitle: string;
}

export function TaskDiscussionSheet({ open, onOpenChange, taskId, taskTitle }: TaskDiscussionSheetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [body, setBody] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!taskId || !open) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("discussion_comments")
        .select("id, user_id, parent_id, content, entity_type, entity_id, entity_title, created_at, author_display_name")
        .eq("entity_type", "task")
        .eq("entity_id", taskId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setRows((data ?? []) as Row[]);
    } catch (e) {
      console.error(e);
      if (!isCommentsDiscussionInfraMissing(e)) {
        toast({
          title: "Couldn’t load task comments",
          description: plannerCommentsToastDescription(e, "load"),
          variant: "destructive",
        });
      }
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [open, taskId, toast]);

  useEffect(() => {
    if (open && taskId) void load();
    if (!open) {
      setBody("");
      setReplyToId(null);
    }
  }, [open, taskId, load]);

  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  const depth = useCallback(
    (r: Row): number => {
      if (!r.parent_id) return 0;
      const p = byId.get(r.parent_id);
      if (!p) return 0;
      return 1 + depth(p);
    },
    [byId],
  );

  const post = async () => {
    if (!user || !taskId) return;
    const text = body.trim();
    if (!text) return;
    setPosting(true);
    try {
      const authorLabel = await resolveAuthorDisplayNameForInsert(user);
      const authorAvatarUrl = await resolveAuthorAvatarUrlForInsert(user);
      const parent = replyToId ? byId.get(replyToId) : null;
      const { error } = await supabase.from("discussion_comments").insert({
        user_id: user.id,
        author_display_name: authorLabel,
        author_avatar_url: authorAvatarUrl,
        parent_id: replyToId,
        content: text,
        entity_type: "task",
        entity_id: taskId,
        entity_title: (parent?.entity_title ?? taskTitle).slice(0, 200),
        attachments: [] as unknown as Json,
        mentions: [],
      });
      if (error) throw error;
      setBody("");
      setReplyToId(null);
      await load();
      toast({ title: "Posted", description: "Your comment was added to this task." });
    } catch (e) {
      console.error(e);
      toast({
        title: "Couldn’t post",
        description: plannerCommentsToastDescription(e, "save"),
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Task comments
          </SheetTitle>
          <SheetDescription className="text-left line-clamp-3">{taskTitle}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="mt-4 flex-1 min-h-[40vh] pr-3">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No comments on this task yet. Add feedback for assignees below.
            </p>
          ) : (
            <ul className="space-y-3 pb-4">
              {rows.map((r) => {
                const d = depth(r);
                const label = r.author_display_name?.trim() || "Member";
                return (
                  <li
                    key={r.id}
                    className="rounded-md border bg-card p-3 text-sm"
                    style={{ marginLeft: d * 12 }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(r.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-foreground/90 whitespace-pre-wrap break-words">{r.content}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 px-2 text-xs"
                      onClick={() => {
                        setReplyToId(r.id);
                      }}
                    >
                      Reply
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        <div className="mt-auto space-y-2 border-t pt-4">
          {replyToId ? (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Replying to a comment</span>
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setReplyToId(null)}>
                Clear
              </Button>
            </div>
          ) : null}
          <Textarea
            placeholder="Add feedback on this task…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            disabled={!user || posting}
          />
          <Button type="button" className="w-full" disabled={!user || posting || !body.trim()} onClick={() => void post()}>
            {posting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Post
          </Button>
          {!user ? <p className="text-xs text-muted-foreground">Sign in to post comments on this task.</p> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

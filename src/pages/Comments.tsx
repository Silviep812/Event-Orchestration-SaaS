import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  commentsPlannerCopy,
  isCommentsDiscussionInfraMissing,
  plannerCommentsToastDescription,
} from "@/lib/nudges";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { User } from "@supabase/supabase-js";
import {
  MessageSquare,
  Send,
  Reply,
  Heart,
  Paperclip,
  Search,
  Edit,
  Trash2,
  Clock,
  AtSign,
  FileText,
  Image as ImageIcon,
  Loader2,
  X,
} from "lucide-react";

const COMMENT_ATTACHMENTS_BUCKET = "comment-attachments";
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/**
 * Team discussions (DB + storage):
 * If the UI shows “discussions aren’t available,” the backend project needs the migrations under
 * `supabase/migrations` applied (e.g. discussion_comments + attachments bucket). Operators: run
 * `supabase db push` or paste SQL in the Supabase SQL Editor — never expose file paths or CLI
 * details to end users; planner copy lives in `@/lib/nudges` (`commentsPlannerCopy`).
 */

interface Comment {
  id: string;
  content: string;
  author: string;
  authorName: string;
  authorAvatar?: string;
  timestamp: string;
  entityType: "event" | "task" | "general";
  entityId: string;
  entityTitle: string;
  parentId?: string;
  replies?: Comment[];
  likes: number;
  isLiked: boolean;
  attachments?: Attachment[];
  mentions?: string[];
  isEdited: boolean;
}

interface Attachment {
  id: string;
  name: string;
  type: "image" | "document";
  url: string;
  size: string;
}

interface StagedFile {
  id: string;
  file: File;
}

type DiscussionRow = {
  id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  entity_type: string;
  entity_id: string;
  entity_title: string;
  attachments: Json;
  mentions: string[];
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  author_display_name?: string | null;
  author_avatar_url?: string | null;
};

/** Fallback when DB snapshot + public_profiles are missing (other users' private profiles are not readable). */
function displayNameFromSession(u: User): string {
  const meta = u.user_metadata as Record<string, unknown> | undefined;
  const full =
    typeof meta?.full_name === "string"
      ? meta.full_name
      : typeof meta?.name === "string"
        ? meta.name
        : "";
  if (full.trim()) return full.trim();
  if (u.email) {
    const local = u.email.split("@")[0];
    if (local) return local;
  }
  return "Member";
}

async function resolveAuthorDisplayNameForInsert(u: User): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("user_id", u.id)
    .maybeSingle();
  const fromProfile = data?.display_name?.trim() || data?.username?.trim();
  if (fromProfile) return fromProfile;
  return displayNameFromSession(u);
}

/** Snapshot at post time so other users can load the image (they cannot read your private `profiles` row). */
async function resolveAuthorAvatarUrlForInsert(u: User): Promise<string | null> {
  const { data: priv } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("user_id", u.id)
    .maybeSingle();
  const fromPriv = priv?.avatar_url?.trim();
  if (fromPriv) return fromPriv;
  const { data: pub } = await supabase
    .from("public_profiles")
    .select("avatar_url")
    .eq("user_id", u.id)
    .maybeSingle();
  const fromPub = pub?.avatar_url?.trim();
  return fromPub || null;
}

function labelForCommentAuthor(
  row: DiscussionRow,
  prof: { display_name: string | null; avatar_url: string | null } | undefined,
  sessionUser: User | null,
): string {
  const fromMap = prof?.display_name?.trim();

  // Your own comments: prefer live `profiles` + public_profiles merge (same as Profile page), not a stale snapshot.
  if (sessionUser && row.user_id === sessionUser.id) {
    if (fromMap) return fromMap;
    const snap = row.author_display_name?.trim();
    if (snap) return snap;
    return displayNameFromSession(sessionUser);
  }

  const snap = row.author_display_name?.trim();
  if (snap) return snap;
  if (fromMap) return fromMap;
  return "Member";
}

/** RLS allows SELECT on `profiles` only for your own row — merge so name/avatar match the rest of the app. */
async function mergeOwnProfileIntoMap(
  userId: string,
  profileMap: Map<string, { display_name: string | null; avatar_url: string | null }>,
) {
  const { data: own } = await supabase
    .from("profiles")
    .select("display_name, username, avatar_url")
    .eq("user_id", userId)
    .maybeSingle();
  if (!own) return;
  const existing = profileMap.get(userId);
  const displayName =
    own.display_name?.trim() || own.username?.trim() || existing?.display_name?.trim() || null;
  profileMap.set(userId, {
    display_name: displayName,
    avatar_url: own.avatar_url ?? existing?.avatar_url ?? null,
  });
}

/** Avatars: other users only via snapshot on row or `public_profiles`; your row uses live merged `profiles`. */
function avatarUrlForRow(
  row: DiscussionRow,
  prof: { display_name: string | null; avatar_url: string | null } | undefined,
  sessionUser: User | null,
): string | undefined {
  const snap = row.author_avatar_url?.trim();
  const fromMap = prof?.avatar_url?.trim();

  if (sessionUser && row.user_id === sessionUser.id) {
    return fromMap || snap || undefined;
  }
  return snap || fromMap || undefined;
}

/** Two-letter initials for avatar fallback (single word uses first two letters). */
function initialsFromDisplayName(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (t.length >= 2) return t.slice(0, 2).toUpperCase();
  return t[0].toUpperCase();
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseAttachments(raw: Json): Attachment[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map((a) => {
      if (!a || typeof a !== "object") return null;
      const o = a as Record<string, unknown>;
      const id = typeof o.id === "string" ? o.id : "";
      const name = typeof o.name === "string" ? o.name : "file";
      const type = o.type === "image" || o.type === "document" ? o.type : "document";
      const url = typeof o.url === "string" ? o.url : "";
      const size = typeof o.size === "string" ? o.size : "";
      if (!id || !url) return null;
      return { id, name, type, url, size };
    })
    .filter(Boolean) as Attachment[];
}

function findCommentById(nodes: Comment[], id: string): Comment | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.replies?.length) {
      const f = findCommentById(n.replies, id);
      if (f) return f;
    }
  }
  return null;
}

function commentOrDescendantMatches(c: Comment, q: string): boolean {
  const t = q.toLowerCase();
  if (
    c.content.toLowerCase().includes(t) ||
    c.authorName.toLowerCase().includes(t) ||
    c.entityTitle.toLowerCase().includes(t)
  ) {
    return true;
  }
  return (c.replies ?? []).some((r) => commentOrDescendantMatches(r, q));
}

function buildCommentTree(
  rows: DiscussionRow[],
  profileMap: Map<string, { display_name: string | null; avatar_url: string | null }>,
  likeCounts: Map<string, number>,
  likedByMe: Set<string>,
  sessionUser: User | null,
): Comment[] {
  const childrenByParent = new Map<string | null, DiscussionRow[]>();
  for (const r of rows) {
    const key = r.parent_id;
    if (!childrenByParent.has(key)) childrenByParent.set(key, []);
    childrenByParent.get(key)!.push(r);
  }
  for (const [, list] of childrenByParent) {
    list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  function rowToComment(row: DiscussionRow): Comment {
    const prof = profileMap.get(row.user_id);
    const name = labelForCommentAuthor(row, prof, sessionUser);
    const attachments = parseAttachments(row.attachments);
    const likes = likeCounts.get(row.id) ?? 0;
    const isLiked = likedByMe.has(row.id);
    const kids = childrenByParent.get(row.id) ?? [];
    return {
      id: row.id,
      content: row.content,
      author: row.user_id,
      authorName: name,
      authorAvatar: avatarUrlForRow(row, prof, sessionUser),
      timestamp: row.created_at,
      entityType: row.entity_type as Comment["entityType"],
      entityId: row.entity_id,
      entityTitle: row.entity_title,
      parentId: row.parent_id ?? undefined,
      replies: kids.map(rowToComment),
      likes,
      isLiked,
      attachments: attachments.length ? attachments : undefined,
      mentions: row.mentions ?? [],
      isEdited: row.is_edited,
    };
  }

  const roots = (childrenByParent.get(null) ?? []).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  return roots.map(rowToComment);
}

export default function Comments() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [comments, setComments] = useState<Comment[]>([]);
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<StagedFile[]>([]);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionProfiles, setMentionProfiles] = useState<
    { user_id: string; display_name: string | null; avatar_url: string | null }[]
  >([]);
  const [discussionSchemaMissing, setDiscussionSchemaMissing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const loadComments = useCallback(async () => {
    if (!user) {
      setComments([]);
      setCommentsLoading(false);
      return;
    }

    setCommentsLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from("discussion_comments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const list = (rows ?? []) as unknown as DiscussionRow[];
      const ids = list.map((r) => r.id);
      const userIds = [...new Set(list.map((r) => r.user_id))];

      let likeRows: { comment_id: string; user_id: string }[] = [];
      if (ids.length > 0) {
        const { data: likesData, error: likesErr } = await supabase
          .from("discussion_comment_likes")
          .select("comment_id, user_id")
          .in("comment_id", ids);
        if (likesErr) throw likesErr;
        likeRows = likesData ?? [];
      }

      const likeCounts = new Map<string, number>();
      const likedByMe = new Set<string>();
      for (const lr of likeRows) {
        likeCounts.set(lr.comment_id, (likeCounts.get(lr.comment_id) ?? 0) + 1);
        if (lr.user_id === user.id) likedByMe.add(lr.comment_id);
      }

      const profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
      if (userIds.length > 0) {
        const { data: profs, error: profErr } = await supabase
          .from("public_profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);
        if (profErr) throw profErr;
        for (const p of profs ?? []) {
          profileMap.set(p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url });
        }
      }

      await mergeOwnProfileIntoMap(user.id, profileMap);

      setDiscussionSchemaMissing(false);
      setComments(buildCommentTree(list, profileMap, likeCounts, likedByMe, user));
    } catch (e) {
      console.error(e);
      const missing = isCommentsDiscussionInfraMissing(e);
      setDiscussionSchemaMissing(missing);
      if (!missing) {
        toast({
          title: "Couldn’t load discussions",
          description: plannerCommentsToastDescription(e, "load"),
          variant: "destructive",
        });
      }
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    if (!user) {
      setMentionProfiles([]);
      return;
    }
    supabase
      .from("public_profiles")
      .select("user_id, display_name, avatar_url")
      .order("display_name", { ascending: true })
      .limit(200)
      .then(({ data, error }) => {
        if (!error && data) setMentionProfiles(data);
      });
  }, [user]);

  const mentionChoices = useMemo(() => {
    const q = mentionQuery.trim().toLowerCase();
    return mentionProfiles.filter((p) => {
      if (p.user_id === user?.id) return false;
      if (!q) return true;
      const name = (p.display_name || "").toLowerCase();
      return name.includes(q) || p.user_id.toLowerCase().includes(q);
    });
  }, [mentionProfiles, mentionQuery, user?.id]);

  useEffect(() => {
    let filtered = comments;

    if (selectedFilter !== "all") {
      filtered = filtered.filter((c) => c.entityType === selectedFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter((c) => commentOrDescendantMatches(c, searchQuery));
    }

    setFilteredComments(filtered);
  }, [comments, selectedFilter, searchQuery]);

  const uploadAttachments = async (): Promise<Attachment[]> => {
    if (!user || pendingFiles.length === 0) return [];

    const uploaded: Attachment[] = [];
    for (const { file } of pendingFiles) {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${user.id}/${crypto.randomUUID()}_${safeName}`;
      const { error: upErr } = await supabase.storage.from(COMMENT_ATTACHMENTS_BUCKET).upload(path, file, {
        upsert: false,
      });
      if (upErr) throw upErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from(COMMENT_ATTACHMENTS_BUCKET).getPublicUrl(path);

      const isImage = file.type.startsWith("image/");
      uploaded.push({
        id: crypto.randomUUID(),
        name: file.name,
        type: isImage ? "image" : "document",
        url: publicUrl,
        size: formatFileSize(file.size),
      });
    }
    return uploaded;
  };

  const handlePostComment = async () => {
    if (!user) {
      toast({
        title: "Sign in to continue",
        description: "Sign in to post comments and join the discussion.",
        variant: "destructive",
      });
      return;
    }

    const content =
      newComment.trim() || (pendingFiles.length > 0 ? "(Attached file)" : "");
    if (!content.trim() && pendingFiles.length === 0) return;

    setPosting(true);
    try {
      const attachments = await uploadAttachments();
      const uniqueMentions = [...new Set(mentionedUserIds)];
      const authorLabel = await resolveAuthorDisplayNameForInsert(user);
      const authorAvatarUrl = await resolveAuthorAvatarUrlForInsert(user);

      const { error } = await supabase.from("discussion_comments").insert({
        user_id: user.id,
        author_display_name: authorLabel,
        author_avatar_url: authorAvatarUrl,
        content: newComment.trim() || content,
        entity_type: "general",
        entity_id: "general",
        entity_title: "General Discussion",
        attachments: (attachments.length ? attachments : []) as unknown as Json,
        mentions: uniqueMentions.length ? uniqueMentions : [],
      });

      if (error) throw error;

      setNewComment("");
      setPendingFiles([]);
      setMentionedUserIds([]);
      await loadComments();

      toast({
        title: "Posted",
        description: "Your comment is in the discussion.",
      });
    } catch (e) {
      console.error(e);
      if (isCommentsDiscussionInfraMissing(e)) setDiscussionSchemaMissing(true);
      toast({
        title: "Couldn’t post your comment",
        description: plannerCommentsToastDescription(e, "save"),
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;

    const parent = findCommentById(comments, parentId);
    if (!parent) {
      toast({
        title: "Couldn’t reply",
        description: "That comment may have been removed. Refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setPosting(true);
    try {
      const authorLabel = await resolveAuthorDisplayNameForInsert(user);
      const authorAvatarUrl = await resolveAuthorAvatarUrlForInsert(user);
      const { error } = await supabase.from("discussion_comments").insert({
        user_id: user.id,
        author_display_name: authorLabel,
        author_avatar_url: authorAvatarUrl,
        parent_id: parentId,
        content: replyContent.trim(),
        entity_type: parent.entityType,
        entity_id: parent.entityId,
        entity_title: parent.entityTitle,
        attachments: [] as unknown as Json,
        mentions: [],
      });

      if (error) throw error;

      setReplyContent("");
      setReplyingTo(null);
      await loadComments();

      toast({
        title: "Posted",
        description: "Your reply is in the discussion.",
      });
    } catch (e) {
      console.error(e);
      if (isCommentsDiscussionInfraMissing(e)) setDiscussionSchemaMissing(true);
      toast({
        title: "Couldn’t post your reply",
        description: plannerCommentsToastDescription(e, "save"),
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) return;

    const target = findCommentById(comments, commentId);
    if (!target) return;

    try {
      if (target.isLiked) {
        const { error } = await supabase
          .from("discussion_comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("discussion_comment_likes").insert({
          comment_id: commentId,
          user_id: user.id,
        });
        if (error) throw error;
      }
      await loadComments();
    } catch (e) {
      console.error(e);
      toast({
        title: "Couldn’t update that",
        description: plannerCommentsToastDescription(e, "save"),
        variant: "destructive",
      });
    }
  };

  const handleEdit = (commentId: string) => {
    const comment = findCommentById(comments, commentId);
    if (comment) {
      setEditingComment(commentId);
      setEditContent(comment.content);
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || !editingComment) return;

    try {
      const { error } = await supabase
        .from("discussion_comments")
        .update({
          content: editContent.trim(),
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingComment);

      if (error) throw error;

      setEditingComment(null);
      setEditContent("");
      await loadComments();

      toast({
        title: "Saved",
        description: "Your comment was updated.",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Couldn’t save your edit",
        description: plannerCommentsToastDescription(e, "save"),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase.from("discussion_comments").delete().eq("id", commentId);
      if (error) throw error;
      await loadComments();
      toast({
        title: "Removed",
        description: "That comment was deleted.",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Couldn’t remove that comment",
        description: plannerCommentsToastDescription(e, "save"),
        variant: "destructive",
      });
    }
  };

  const insertMention = (displayName: string, userId: string) => {
    const label = displayName.trim() || "User";
    const mentionText = `@${label} `;
    const ta = composerRef.current;
    if (ta) {
      const start = ta.selectionStart ?? newComment.length;
      const end = ta.selectionEnd ?? newComment.length;
      const next = newComment.slice(0, start) + mentionText + newComment.slice(end);
      setNewComment(next);
      setMentionedUserIds((prev) => Array.from(new Set([...prev, userId])));
      setMentionOpen(false);
      setMentionQuery("");
      requestAnimationFrame(() => {
        ta.focus();
        const pos = start + mentionText.length;
        ta.setSelectionRange(pos, pos);
      });
    } else {
      setNewComment((prev) => prev + mentionText);
      setMentionedUserIds((prev) => Array.from(new Set([...prev, userId])));
      setMentionOpen(false);
      setMentionQuery("");
    }
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const next: StagedFile[] = [];
    for (const f of files) {
      if (f.size > MAX_ATTACHMENT_BYTES) {
        toast({
          title: "File too large",
          description: `Max size is ${formatFileSize(MAX_ATTACHMENT_BYTES)} per file.`,
          variant: "destructive",
        });
        continue;
      }
      next.push({ id: crypto.randomUUID(), file: f });
    }
    setPendingFiles((prev) => [...prev, ...next]);
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <Card key={comment.id} className={`${isReply ? "ml-8 mt-3" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={comment.authorAvatar} />
            <AvatarFallback>{initialsFromDisplayName(comment.authorName)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="font-medium text-sm">{comment.authorName}</span>
                <Badge variant="outline" className="text-xs max-w-[12rem] truncate">
                  {comment.entityTitle}
                </Badge>
                {comment.isEdited && (
                  <Badge variant="secondary" className="text-xs">
                    Edited
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Clock className="w-3 h-3" />
                <span>{new Date(comment.timestamp).toLocaleString()}</span>
              </div>
            </div>

            {editingComment === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-20"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>
                    Save Changes
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingComment(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed break-words">{comment.content}</p>
            )}

            {comment.attachments && comment.attachments.length > 0 && (
              <div className="space-y-2">
                {comment.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 border rounded-md hover:bg-muted/50 transition-colors"
                  >
                    {attachment.type === "image" ? (
                      <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-green-500 shrink-0" />
                    )}
                    <span className="text-sm truncate">{attachment.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">({attachment.size})</span>
                  </a>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
              <div className="flex items-center gap-4 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(comment.id)}
                  disabled={!user}
                  className={comment.isLiked ? "text-red-500" : ""}
                >
                  <Heart className={`w-4 h-4 mr-1 ${comment.isLiked ? "fill-current" : ""}`} />
                  {comment.likes}
                </Button>

                {!isReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(comment.id)}
                    disabled={!user}
                  >
                    <Reply className="w-4 h-4 mr-1" />
                    Reply
                  </Button>
                )}

                {comment.author === user?.id && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(comment.id)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(comment.id)}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>

            {replyingTo === comment.id && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-20"
                  disabled={posting || discussionSchemaMissing}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleReply(comment.id)}
                    disabled={posting || !replyContent.trim() || discussionSchemaMissing}
                    className="gap-2"
                  >
                    {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Post Reply
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)} disabled={posting}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-0">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Comments & Discussions
          </h1>
          <p className="text-muted-foreground">Collaborate and discuss your event planning activities</p>
        </div>
      </div>

      {discussionSchemaMissing && (
        <Alert variant="destructive">
          <MessageSquare className="h-4 w-4" />
          <AlertTitle>{commentsPlannerCopy.schemaMissingTitle}</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{commentsPlannerCopy.schemaMissingBody}</p>
            <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => loadComments()}>
              {commentsPlannerCopy.retryButton}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!user && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Sign in to post comments, attach files, and mention teammates. You can still read the discussion below.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Start a Discussion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={onPickFiles}
            accept="image/*,.pdf,.doc,.docx,.txt,.csv"
          />
          <Textarea
            ref={composerRef}
            placeholder="Share your thoughts, ask questions, or provide updates..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-24"
            disabled={!user || posting || discussionSchemaMissing}
          />

          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pendingFiles.map((pf) => (
                <Badge key={pf.id} variant="secondary" className="gap-1 pl-2 pr-1 py-1 font-normal">
                  <Paperclip className="w-3 h-3" />
                  <span className="max-w-[12rem] truncate">{pf.file.name}</span>
                  <span className="text-xs opacity-80">({formatFileSize(pf.file.size)})</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0"
                    onClick={() => setPendingFiles((prev) => prev.filter((x) => x.id !== pf.id))}
                    aria-label="Remove attachment"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!user || posting || discussionSchemaMissing}
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-4 h-4 mr-1" />
                Attach File
              </Button>
              <Popover open={mentionOpen} onOpenChange={setMentionOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!user || posting || discussionSchemaMissing}
                  >
                    <AtSign className="w-4 h-4 mr-1" />
                    Mention
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-2" align="start">
                  <p className="text-xs text-muted-foreground mb-2">{commentsPlannerCopy.mentionHelper}</p>
                  <Input
                    placeholder={commentsPlannerCopy.mentionSearchLabel}
                    value={mentionQuery}
                    onChange={(e) => setMentionQuery(e.target.value)}
                    className="h-8 mb-2"
                  />
                  <div className="max-h-52 overflow-y-auto space-y-0.5">
                    {mentionChoices.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">No people match your search.</p>
                    ) : (
                      mentionChoices.map((p) => (
                        <button
                          key={p.user_id}
                          type="button"
                          className="w-full text-left px-2 py-1.5 rounded-sm text-sm hover:bg-muted flex items-center gap-2"
                          onClick={() => insertMention(p.display_name || p.user_id.slice(0, 8), p.user_id)}
                        >
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={p.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[10px]">
                              {(p.display_name || "?")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{p.display_name || p.user_id}</span>
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Button
              type="button"
              onClick={handlePostComment}
              disabled={
                !user ||
                posting ||
                discussionSchemaMissing ||
                (!newComment.trim() && pendingFiles.length === 0)
              }
            >
              {posting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Post Comment
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 min-w-0 flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-w-0"
          />
        </div>

        <Select value={selectedFilter} onValueChange={setSelectedFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Comments</SelectItem>
            <SelectItem value="event">Event Comments</SelectItem>
            <SelectItem value="task">Task Comments</SelectItem>
            <SelectItem value="general">General Discussion</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="outline">{filteredComments.length} comments</Badge>
      </div>

      <div className="space-y-4">
        {commentsLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              Loading comments…
            </CardContent>
          </Card>
        ) : filteredComments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No comments found</h3>
              <p className="text-muted-foreground text-center">
                {searchQuery || selectedFilter !== "all"
                  ? "No comments match your current search or filter."
                  : "Be the first to start a discussion!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredComments.map((comment) => renderComment(comment))
        )}
      </div>
    </div>
  );
}

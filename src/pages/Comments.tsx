import { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useEventFilter } from "@/hooks/useEventFilter";
import {
  displayNameFromSession,
  resolveAuthorAvatarUrlForInsert,
  resolveAuthorDisplayNameForInsert,
} from "@/lib/discussionAuthor";
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
  Megaphone,
  FolderOpen,
  ClipboardList,
} from "lucide-react";

const COMMENT_ATTACHMENTS_BUCKET = "comment-attachments";
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

interface Comment {
  id: string;
  content: string;
  author: string;
  authorName: string;
  authorAvatar?: string;
  timestamp: string;
  entityType: "event" | "task" | "general" | "announcement";
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

type HubTab = "workspace" | "discussions" | "announcements" | "tasks" | "files";

function normalizedHub(v: string | null): HubTab {
  if (v === "discussions" || v === "announcements" || v === "tasks" || v === "files") return v;
  return "workspace";
}

export default function Comments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { events, eventsLoading } = useEventFilter();

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
  const [hubTab, setHubTab] = useState<HubTab>(() =>
    typeof globalThis !== "undefined" && "location" in globalThis
      ? normalizedHub(new URLSearchParams((globalThis as unknown as Window).location.search).get("hub"))
      : "workspace",
  );
  const [hubEventId, setHubEventId] = useState("");
  const [hubTaskId, setHubTaskId] = useState("");
  const [flatDiscussionRows, setFlatDiscussionRows] = useState<DiscussionRow[]>([]);
  const [eventTasks, setEventTasks] = useState<{ id: string; title: string }[]>([]);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [eventThreadBody, setEventThreadBody] = useState("");
  const [taskThreadBody, setTaskThreadBody] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const bumpHubUrl = useCallback(
    (tab: HubTab, eventId: string, taskId: string) => {
      const next = new URLSearchParams(searchParams);
      if (tab === "workspace") next.delete("hub");
      else next.set("hub", tab);
      if (eventId) next.set("eventId", eventId);
      else next.delete("eventId");
      if (tab === "tasks" && taskId) next.set("taskId", taskId);
      else next.delete("taskId");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const loadComments = useCallback(async () => {
    if (!user) {
      setComments([]);
      setFlatDiscussionRows([]);
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
      setFlatDiscussionRows(list);
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
      setFlatDiscussionRows([]);
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

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const eid = sp.get("eventId") ?? "";
    const tid = sp.get("taskId") ?? "";
    if (eid) setHubEventId(eid);
    if (tid) setHubTaskId(tid);
  }, []);

  useEffect(() => {
    if (!hubEventId) {
      setEventTasks([]);
      return;
    }
    void supabase
      .from("tasks")
      .select("id, title")
      .eq("event_id", hubEventId)
      .order("title", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setEventTasks(data as { id: string; title: string }[]);
        else setEventTasks([]);
      });
  }, [hubEventId]);

  const eventTaskIdSet = useMemo(() => new Set(eventTasks.map((t) => t.id)), [eventTasks]);

  const scopedFileRows = useMemo(() => {
    if (!hubEventId) return [];
    return flatDiscussionRows.flatMap((row) => {
      const atts = parseAttachments(row.attachments);
      if (!atts.length) return [];
      const inScope =
        (row.entity_type === "event" && row.entity_id === hubEventId) ||
        (row.entity_type === "announcement" && row.entity_id === hubEventId) ||
        (row.entity_type === "task" && eventTaskIdSet.has(row.entity_id));
      if (!inScope) return [];
      return atts.map((attachment) => ({
        attachment,
        contextTitle: row.entity_title,
        at: row.created_at,
        commentId: row.id,
      }));
    });
  }, [flatDiscussionRows, hubEventId, eventTaskIdSet]);

  useEffect(() => {
    const applySearch = (list: Comment[]) => {
      if (!searchQuery.trim()) return list;
      return list.filter((c) => commentOrDescendantMatches(c, searchQuery));
    };

    if (hubTab === "files") {
      setFilteredComments([]);
      return;
    }

    if (hubTab === "workspace") {
      let filtered = comments;
      if (selectedFilter !== "all") {
        filtered = filtered.filter((c) => c.entityType === selectedFilter);
      }
      setFilteredComments(applySearch(filtered));
      return;
    }

    if (!hubEventId) {
      setFilteredComments([]);
      return;
    }

    if (hubTab === "discussions") {
      setFilteredComments(applySearch(comments.filter((c) => c.entityType === "event" && c.entityId === hubEventId)));
      return;
    }
    if (hubTab === "announcements") {
      setFilteredComments(
        applySearch(comments.filter((c) => c.entityType === "announcement" && c.entityId === hubEventId)),
      );
      return;
    }
    if (hubTab === "tasks") {
      if (!hubTaskId) {
        setFilteredComments([]);
        return;
      }
      setFilteredComments(applySearch(comments.filter((c) => c.entityType === "task" && c.entityId === hubTaskId)));
      return;
    }
    setFilteredComments([]);
  }, [comments, hubTab, hubEventId, hubTaskId, searchQuery, selectedFilter]);

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

  const handlePostEventDiscussion = async () => {
    if (!user) {
      toast({
        title: "Sign in to continue",
        description: "Sign in to post to this event thread.",
        variant: "destructive",
      });
      return;
    }
    if (!hubEventId) {
      toast({ title: "Pick an event", description: "Select an event to start a threaded discussion.", variant: "destructive" });
      return;
    }
    const text = eventThreadBody.trim() || (pendingFiles.length > 0 ? "(Attached file)" : "");
    if (!text.trim() && pendingFiles.length === 0) return;

    setPosting(true);
    try {
      const attachments = await uploadAttachments();
      const uniqueMentions = [...new Set(mentionedUserIds)];
      const authorLabel = await resolveAuthorDisplayNameForInsert(user);
      const authorAvatarUrl = await resolveAuthorAvatarUrlForInsert(user);
      const ev = events.find((e) => e.id === hubEventId);
      const { error } = await supabase.from("discussion_comments").insert({
        user_id: user.id,
        author_display_name: authorLabel,
        author_avatar_url: authorAvatarUrl,
        content: eventThreadBody.trim() || text,
        entity_type: "event",
        entity_id: hubEventId,
        entity_title: (ev?.title ?? "Event").slice(0, 200),
        attachments: (attachments.length ? attachments : []) as unknown as Json,
        mentions: uniqueMentions.length ? uniqueMentions : [],
      });
      if (error) throw error;
      setEventThreadBody("");
      setPendingFiles([]);
      setMentionedUserIds([]);
      await loadComments();
      toast({ title: "Posted", description: "Your message was added to this event’s discussion." });
    } catch (e) {
      console.error(e);
      if (isCommentsDiscussionInfraMissing(e)) setDiscussionSchemaMissing(true);
      toast({
        title: "Couldn’t post",
        description: plannerCommentsToastDescription(e, "save"),
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!user) {
      toast({
        title: "Sign in to continue",
        description: "Sign in to post an announcement.",
        variant: "destructive",
      });
      return;
    }
    if (!hubEventId) {
      toast({ title: "Pick an event", description: "Select an event for the announcement board.", variant: "destructive" });
      return;
    }
    const title = announcementTitle.trim() || "Team update";
    const body = announcementBody.trim() || (pendingFiles.length > 0 ? "(Attached file)" : "");
    if (!body.trim() && pendingFiles.length === 0) return;

    setPosting(true);
    try {
      const attachments = await uploadAttachments();
      const authorLabel = await resolveAuthorDisplayNameForInsert(user);
      const authorAvatarUrl = await resolveAuthorAvatarUrlForInsert(user);
      const { error } = await supabase.from("discussion_comments").insert({
        user_id: user.id,
        author_display_name: authorLabel,
        author_avatar_url: authorAvatarUrl,
        content: announcementBody.trim() || body,
        entity_type: "announcement",
        entity_id: hubEventId,
        entity_title: title.slice(0, 200),
        attachments: (attachments.length ? attachments : []) as unknown as Json,
        mentions: [],
      });
      if (error) throw error;
      setAnnouncementTitle("");
      setAnnouncementBody("");
      setPendingFiles([]);
      await loadComments();
      toast({ title: "Posted", description: "Announcement is visible to everyone on this event board." });
    } catch (e) {
      console.error(e);
      if (isCommentsDiscussionInfraMissing(e)) setDiscussionSchemaMissing(true);
      toast({
        title: "Couldn’t post announcement",
        description: plannerCommentsToastDescription(e, "save"),
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  const handlePostTaskThread = async () => {
    if (!user) {
      toast({
        title: "Sign in to continue",
        description: "Sign in to comment on this task.",
        variant: "destructive",
      });
      return;
    }
    if (!hubEventId || !hubTaskId) {
      toast({
        title: "Pick event and task",
        description: "Select an event and a task to add task-level feedback.",
        variant: "destructive",
      });
      return;
    }
    const text = taskThreadBody.trim() || (pendingFiles.length > 0 ? "(Attached file)" : "");
    if (!text.trim() && pendingFiles.length === 0) return;

    setPosting(true);
    try {
      const attachments = await uploadAttachments();
      const uniqueMentions = [...new Set(mentionedUserIds)];
      const authorLabel = await resolveAuthorDisplayNameForInsert(user);
      const authorAvatarUrl = await resolveAuthorAvatarUrlForInsert(user);
      const task = eventTasks.find((t) => t.id === hubTaskId);
      const { error } = await supabase.from("discussion_comments").insert({
        user_id: user.id,
        author_display_name: authorLabel,
        author_avatar_url: authorAvatarUrl,
        content: taskThreadBody.trim() || text,
        entity_type: "task",
        entity_id: hubTaskId,
        entity_title: (task?.title ?? "Task").slice(0, 200),
        attachments: (attachments.length ? attachments : []) as unknown as Json,
        mentions: uniqueMentions.length ? uniqueMentions : [],
      });
      if (error) throw error;
      setTaskThreadBody("");
      setPendingFiles([]);
      setMentionedUserIds([]);
      await loadComments();
      toast({ title: "Posted", description: "Your comment was linked to this task." });
    } catch (e) {
      console.error(e);
      if (isCommentsDiscussionInfraMissing(e)) setDiscussionSchemaMissing(true);
      toast({
        title: "Couldn’t post",
        description: plannerCommentsToastDescription(e, "save"),
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  const onHubTabChange = (v: string) => {
    const tab = normalizedHub(v);
    setHubTab(tab);
    bumpHubUrl(tab, hubEventId, hubTaskId);
  };

  const onHubEventChange = (value: string) => {
    const nextEvent = value === "__pick__" ? "" : value;
    setHubEventId(nextEvent);
    bumpHubUrl(hubTab, nextEvent, hubTaskId);
  };

  const onHubTaskChange = (value: string) => {
    const nextTask = value === "__pick_task__" ? "" : value;
    setHubTaskId(nextTask);
    bumpHubUrl(hubTab, hubEventId, nextTask);
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
                {comment.entityType === "announcement" ? (
                  <Badge variant="secondary" className="text-xs shrink-0 gap-1">
                    <Megaphone className="h-3 w-3" />
                    Announcement
                  </Badge>
                ) : null}
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
            Team Communication Hub
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            Threaded discussions by event, task-level feedback, file attachments on posts, and an announcement board
            for critical updates — all in one place.
          </p>
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

      <Tabs value={hubTab} onValueChange={onHubTabChange} className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={onPickFiles}
          accept="image/*,.pdf,.doc,.docx,.txt,.csv"
        />
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="workspace" className="gap-1 text-xs sm:text-sm">
            <MessageSquare className="h-4 w-4 shrink-0" />
            Workspace
          </TabsTrigger>
          <TabsTrigger value="discussions" className="gap-1 text-xs sm:text-sm">
            <MessageSquare className="h-4 w-4 shrink-0" />
            Event threads
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-1 text-xs sm:text-sm">
            <Megaphone className="h-4 w-4 shrink-0" />
            Announcements
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1 text-xs sm:text-sm">
            <ClipboardList className="h-4 w-4 shrink-0" />
            Task feedback
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-1 text-xs sm:text-sm">
            <FolderOpen className="h-4 w-4 shrink-0" />
            Shared files
          </TabsTrigger>
        </TabsList>

        {hubTab !== "workspace" ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end rounded-lg border bg-muted/20 p-4">
            <div className="space-y-2 min-w-[12rem] max-w-md flex-1">
              <Label htmlFor="hub-event-scope">Event</Label>
              <Select
                value={hubEventId || "__pick__"}
                onValueChange={onHubEventChange}
                disabled={eventsLoading}
              >
                <SelectTrigger id="hub-event-scope">
                  <SelectValue placeholder={eventsLoading ? "Loading…" : "Choose an event"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__pick__">Choose an event…</SelectItem>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hubTab === "tasks" ? (
              <div className="space-y-2 min-w-[12rem] max-w-md flex-1">
                <Label htmlFor="hub-task-scope">Task</Label>
                <Select value={hubTaskId || "__pick_task__"} onValueChange={onHubTaskChange} disabled={!hubEventId}>
                  <SelectTrigger id="hub-task-scope">
                    <SelectValue placeholder="Choose a task" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__pick_task__">Choose a task…</SelectItem>
                    {eventTasks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        ) : null}

        {hubTab !== "files" && pendingFiles.length > 0 ? (
          <div className="flex flex-wrap gap-2 rounded-md border border-dashed p-3 bg-background/80">
            <span className="text-xs text-muted-foreground w-full">Staged attachments (apply to your next post)</span>
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
        ) : null}

        <TabsContent value="workspace" className="mt-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Workspace discussion
              </CardTitle>
              <CardDescription>Cross-event general threads, mentions, and attachments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                ref={composerRef}
                placeholder="Share your thoughts, ask questions, or provide updates..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-24"
                disabled={!user || posting || discussionSchemaMissing}
              />
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
                  Post
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discussions" className="mt-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Threaded event discussion</CardTitle>
              <CardDescription>Posts and replies are stored on this event. Pick an event above, then write below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hubEventId ? (
                <p className="text-sm text-muted-foreground">Select an event to view and post to its discussion thread.</p>
              ) : (
                <>
                  <Textarea
                    placeholder="Start or continue the conversation for this event…"
                    value={eventThreadBody}
                    onChange={(e) => setEventThreadBody(e.target.value)}
                    className="min-h-24"
                    disabled={!user || posting || discussionSchemaMissing}
                  />
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
                    <Button
                      type="button"
                      onClick={handlePostEventDiscussion}
                      disabled={
                        !user ||
                        posting ||
                        discussionSchemaMissing ||
                        (!eventThreadBody.trim() && pendingFiles.length === 0)
                      }
                    >
                      {posting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      Post to event
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="mt-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                Announcement board
              </CardTitle>
              <CardDescription>High-visibility updates for everyone working on the selected event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hubEventId ? (
                <p className="text-sm text-muted-foreground">Select an event to post and read announcements.</p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="announcement-headline">Headline</Label>
                    <Input
                      id="announcement-headline"
                      placeholder="e.g. Load-in gate change — read today"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      maxLength={200}
                      disabled={!user || posting || discussionSchemaMissing}
                    />
                  </div>
                  <Textarea
                    placeholder="Critical details for the whole team…"
                    value={announcementBody}
                    onChange={(e) => setAnnouncementBody(e.target.value)}
                    className="min-h-24"
                    disabled={!user || posting || discussionSchemaMissing}
                  />
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
                    <Button
                      type="button"
                      onClick={handlePostAnnouncement}
                      disabled={
                        !user ||
                        posting ||
                        discussionSchemaMissing ||
                        (!announcementBody.trim() && pendingFiles.length === 0)
                      }
                    >
                      {posting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      Post announcement
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task-level comments</CardTitle>
              <CardDescription>Feedback stays tied to a specific task (also available from Project Management).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hubEventId || !hubTaskId ? (
                <p className="text-sm text-muted-foreground">Select an event and a task to view and post comments.</p>
              ) : (
                <>
                  <Textarea
                    placeholder="Add feedback for this task…"
                    value={taskThreadBody}
                    onChange={(e) => setTaskThreadBody(e.target.value)}
                    className="min-h-24"
                    disabled={!user || posting || discussionSchemaMissing}
                  />
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
                    <Button
                      type="button"
                      onClick={handlePostTaskThread}
                      disabled={
                        !user ||
                        posting ||
                        discussionSchemaMissing ||
                        (!taskThreadBody.trim() && pendingFiles.length === 0)
                      }
                    >
                      {posting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      Post to task
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="mt-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Files shared on this event
              </CardTitle>
              <CardDescription>
                Documents and images attached to event threads, announcements, or tasks for the selected event.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!hubEventId ? (
                <p className="text-sm text-muted-foreground">Select an event to list uploads from its communications.</p>
              ) : scopedFileRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No files attached yet for this event.</p>
              ) : (
                <ul className="space-y-2">
                  {scopedFileRows.map(({ attachment, contextTitle, at, commentId }) => (
                    <li key={`${commentId}-${attachment.id}`}>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-md border p-3 text-sm hover:bg-muted/50"
                      >
                        {attachment.type === "image" ? (
                          <ImageIcon className="h-4 w-4 text-blue-500 shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 text-green-500 shrink-0" />
                        )}
                        <span className="flex-1 min-w-0 truncate font-medium">{attachment.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{attachment.size}</span>
                      </a>
                      <p className="text-xs text-muted-foreground mt-1 pl-1">
                        From “{contextTitle}” · {new Date(at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {hubTab !== "files" ? (
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

          {hubTab === "workspace" ? (
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Comments</SelectItem>
                <SelectItem value="event">Event Comments</SelectItem>
                <SelectItem value="task">Task Comments</SelectItem>
                <SelectItem value="announcement">Announcements</SelectItem>
                <SelectItem value="general">General Discussion</SelectItem>
              </SelectContent>
            </Select>
          ) : null}

          <Badge variant="outline">
            {filteredComments.length} {hubTab === "announcements" ? "announcements" : "threads"}
          </Badge>
        </div>
      ) : null}

      <div className="space-y-4">
        {hubTab === "files" ? null : commentsLoading ? (
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
              <h3 className="font-semibold mb-2">Nothing here yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {hubTab !== "workspace" && !hubEventId
                  ? "Choose an event above to load this tab."
                  : hubTab === "tasks" && !hubTaskId
                    ? "Pick a task to see its comment thread."
                    : searchQuery || (hubTab === "workspace" && selectedFilter !== "all")
                      ? "No threads match your search or filter."
                      : "Start the conversation using the composer above."}
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

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  MessageSquare, 
  Send, 
  Reply, 
  Heart, 
  Flag, 
  Paperclip,
  Search,
  Filter,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AtSign,
  Plus,
  FileText,
  Image as ImageIcon
} from "lucide-react";

interface Comment {
  id: string;
  content: string;
  author: string;
  authorName: string;
  authorAvatar?: string;
  timestamp: string;
  entityType: 'event' | 'task' | 'general';
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
  type: 'image' | 'document';
  url: string;
  size: string;
}

export default function Comments() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedEntity, setSelectedEntity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Mock comments data
  useEffect(() => {
    const mockComments: Comment[] = [
      {
        id: "1",
        content: "I think we should reconsider the venue layout. The current setup might not accommodate all the technical equipment we need for the AV presentation.",
        author: "1",
        authorName: "John Doe",
        timestamp: "2024-08-15T14:30:00Z",
        entityType: "event",
        entityId: "event1",
        entityTitle: "Annual Company Gala",
        likes: 3,
        isLiked: false,
        mentions: [],
        isEdited: false,
        replies: [
          {
            id: "1-1",
            content: "Good point! I'll check with the venue coordinator about alternative layouts.",
            author: "2",
            authorName: "Sarah Wilson",
            timestamp: "2024-08-15T15:00:00Z",
            entityType: "event",
            entityId: "event1",
            entityTitle: "Annual Company Gala",
            parentId: "1",
            likes: 1,
            isLiked: true,
            mentions: ["1"],
            isEdited: false
          }
        ]
      },
      {
        id: "2",
        content: "The catering menu looks great! However, we should add more vegetarian options. I noticed we only have two options currently.",
        author: "2",
        authorName: "Sarah Wilson",
        timestamp: "2024-08-15T13:45:00Z",
        entityType: "task",
        entityId: "task2",
        entityTitle: "Catering Menu Selection",
        likes: 5,
        isLiked: true,
        mentions: [],
        isEdited: false,
        attachments: [
          {
            id: "att1",
            name: "menu_draft_v2.pdf",
            type: "document",
            url: "#",
            size: "2.1 MB"
          }
        ]
      },
      {
        id: "3",
        content: "@Mike Johnson Could you please provide an update on the audio equipment rental? We need to confirm the specifications by Friday.",
        author: "1",
        authorName: "John Doe",
        timestamp: "2024-08-15T12:15:00Z",
        entityType: "task",
        entityId: "task3",
        entityTitle: "Audio/Visual Setup",
        likes: 0,
        isLiked: false,
        mentions: ["3"],
        isEdited: false
      },
      {
        id: "4",
        content: "Just wanted to share some inspiration photos for the decorations. These color schemes might work well with our theme.",
        author: "3",
        authorName: "Mike Johnson",
        timestamp: "2024-08-15T11:30:00Z",
        entityType: "general",
        entityId: "general",
        entityTitle: "General Discussion",
        likes: 7,
        isLiked: false,
        mentions: [],
        isEdited: false,
        attachments: [
          {
            id: "att2",
            name: "decoration_ideas.jpg",
            type: "image",
            url: "#",
            size: "1.8 MB"
          },
          {
            id: "att3",
            name: "color_palette.jpg",
            type: "image",
            url: "#",
            size: "0.9 MB"
          }
        ]
      },
      {
        id: "5",
        content: "The guest list has been updated. We're now at 150 confirmed attendees. Should we start planning for 160-170 to account for last-minute additions?",
        author: "2",
        authorName: "Sarah Wilson",
        timestamp: "2024-08-15T10:45:00Z",
        entityType: "task",
        entityId: "task4",
        entityTitle: "Guest List Management",
        likes: 2,
        isLiked: false,
        mentions: [],
        isEdited: true
      }
    ];

    setComments(mockComments);
    setFilteredComments(mockComments);
  }, []);

  // Filter comments
  useEffect(() => {
    let filtered = comments;
    
    // Filter by entity type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(c => c.entityType === selectedFilter);
    }
    
    // Filter by specific entity
    if (selectedEntity !== 'all') {
      filtered = filtered.filter(c => c.entityId === selectedEntity);
    }
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.entityTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredComments(filtered);
  }, [comments, selectedFilter, selectedEntity, searchQuery]);

  const handlePostComment = () => {
    if (!newComment.trim() || !user) return;

    const comment: Comment = {
      id: Date.now().toString(),
      content: newComment,
      author: user.id,
      authorName: user.email || "Current User",
      timestamp: new Date().toISOString(),
      entityType: "general",
      entityId: "general",
      entityTitle: "General Discussion",
      likes: 0,
      isLiked: false,
      mentions: [],
      isEdited: false
    };

    setComments(prev => [comment, ...prev]);
    setNewComment("");

    toast({
      title: "Comment posted",
      description: "Your comment has been posted successfully.",
    });
  };

  const handleReply = (parentId: string) => {
    if (!replyContent.trim() || !user) return;

    const reply: Comment = {
      id: `${parentId}-${Date.now()}`,
      content: replyContent,
      author: user.id,
      authorName: user.email || "Current User",
      timestamp: new Date().toISOString(),
      entityType: "general",
      entityId: "general",
      entityTitle: "General Discussion",
      parentId,
      likes: 0,
      isLiked: false,
      mentions: [],
      isEdited: false
    };

    setComments(prev => 
      prev.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), reply]
          };
        }
        return comment;
      })
    );

    setReplyContent("");
    setReplyingTo(null);

    toast({
      title: "Reply posted",
      description: "Your reply has been posted successfully.",
    });
  };

  const handleLike = (commentId: string) => {
    setComments(prev =>
      prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
          };
        }
        
        // Check replies too
        if (comment.replies) {
          const updatedReplies = comment.replies.map(reply => {
            if (reply.id === commentId) {
              return {
                ...reply,
                isLiked: !reply.isLiked,
                likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1
              };
            }
            return reply;
          });
          
          return { ...comment, replies: updatedReplies };
        }
        
        return comment;
      })
    );
  };

  const handleEdit = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      setEditingComment(commentId);
      setEditContent(comment.content);
    }
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;

    setComments(prev =>
      prev.map(comment => {
        if (comment.id === editingComment) {
          return {
            ...comment,
            content: editContent,
            isEdited: true
          };
        }
        return comment;
      })
    );

    setEditingComment(null);
    setEditContent("");

    toast({
      title: "Comment updated",
      description: "Your comment has been updated successfully.",
    });
  };

  const handleDelete = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    toast({
      title: "Comment deleted",
      description: "The comment has been removed.",
    });
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <Card key={comment.id} className={`${isReply ? 'ml-8 mt-3' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={comment.authorAvatar} />
            <AvatarFallback>
              {comment.authorName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{comment.authorName}</span>
                <Badge variant="outline" className="text-xs">
                  {comment.entityTitle}
                </Badge>
                {comment.isEdited && (
                  <Badge variant="secondary" className="text-xs">
                    Edited
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
              <p className="text-sm leading-relaxed">{comment.content}</p>
            )}
            
            {comment.attachments && comment.attachments.length > 0 && (
              <div className="space-y-2">
                {comment.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center gap-2 p-2 border rounded-md">
                    {attachment.type === 'image' ? (
                      <ImageIcon className="w-4 h-4 text-blue-500" />
                    ) : (
                      <FileText className="w-4 h-4 text-green-500" />
                    )}
                    <span className="text-sm">{attachment.name}</span>
                    <span className="text-xs text-muted-foreground">({attachment.size})</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(comment.id)}
                  className={comment.isLiked ? 'text-red-500' : ''}
                >
                  <Heart className={`w-4 h-4 mr-1 ${comment.isLiked ? 'fill-current' : ''}`} />
                  {comment.likes}
                </Button>
                
                {!isReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(comment.id)}
                  >
                    <Reply className="w-4 h-4 mr-1" />
                    Reply
                  </Button>
                )}
                
                {comment.author === user?.id && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(comment.id)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(comment.id)}
                    >
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
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleReply(comment.id)}>
                    Post Reply
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4">
            {comment.replies.map(reply => renderComment(reply, true))}
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
          <p className="text-muted-foreground">
            Collaborate and discuss your event planning activities
          </p>
        </div>
      </div>

      {/* New Comment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Start a Discussion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Share your thoughts, ask questions, or provide updates..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-24"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Paperclip className="w-4 h-4 mr-1" />
                Attach File
              </Button>
              <Button variant="outline" size="sm">
                <AtSign className="w-4 h-4 mr-1" />
                Mention
              </Button>
            </div>
            <Button onClick={handlePostComment}>
              <Send className="w-4 h-4 mr-2" />
              Post Comment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
        </div>
        
        <Select value={selectedFilter} onValueChange={setSelectedFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Comments</SelectItem>
            <SelectItem value="event">Event Comments</SelectItem>
            <SelectItem value="task">Task Comments</SelectItem>
            <SelectItem value="general">General Discussion</SelectItem>
          </SelectContent>
        </Select>
        
        <Badge variant="outline">
          {filteredComments.length} comments
        </Badge>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No comments found</h3>
              <p className="text-muted-foreground text-center">
                {searchQuery || selectedFilter !== 'all' 
                  ? "No comments match your current search or filter."
                  : "Be the first to start a discussion!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredComments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  );
}
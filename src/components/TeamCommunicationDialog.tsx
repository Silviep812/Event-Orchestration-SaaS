import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { commentsPlannerCopy, plannerSafeErrorToastDescription } from "@/lib/nudges";
import { fetchEventStakeholderRecipientIds } from "@/lib/urgentChangeRequestNotifications";

interface TeamCommunicationDialogProps {
  eventId: string | null;
  triggerClassName?: string;
}

/**
 * In-app “communication message” to every stakeholder on the event (organizer + CM members).
 */
export function TeamCommunicationDialog({ eventId, triggerClassName }: TeamCommunicationDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);

  const refreshRecipients = useCallback(async () => {
    if (!eventId) {
      setRecipientCount(0);
      return;
    }
    try {
      const ids = await fetchEventStakeholderRecipientIds(eventId);
      setRecipientCount(ids.length);
    } catch {
      setRecipientCount(0);
    }
  }, [eventId]);

  useEffect(() => {
    if (open) void refreshRecipients();
  }, [open, refreshRecipients]);

  const send = async () => {
    if (!eventId || !user?.id) {
      toast({ title: "Select an event", description: "Choose an event before sending a team message.", variant: "destructive" });
      return;
    }
    const t = title.trim();
    const m = message.trim();
    if (!t || !m) {
      toast({ title: "Missing fields", description: "Add a subject and message.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const recipients = await fetchEventStakeholderRecipientIds(eventId);
      const targets = recipients.filter((id) => id && id !== user.id);
      if (targets.length === 0) {
        toast({
          title: "No recipients",
          description: "Add CM event members or confirm the event organizer so messages have a recipient.",
          variant: "destructive",
        });
        setSending(false);
        return;
      }
      const rows = targets.map((recipient_id) => ({
        recipient_id,
        sender_id: user.id,
        title: t,
        message: m,
        type: "event_update",
        entity_type: "event" as const,
        entity_id: eventId,
        event_id: eventId,
        is_read: false,
      }));
      const { error } = await supabase.from("notifications").insert(rows);
      if (error) throw error;
      toast({
        title: "Message sent",
        description: `Delivered to ${targets.length} team member(s).`,
      });
      setTitle("");
      setMessage("");
      setOpen(false);
    } catch (e) {
      toast({
        title: "Could not send",
        description: plannerSafeErrorToastDescription(e, commentsPlannerCopy.toastGeneric),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={triggerClassName} disabled={!eventId}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Message team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Team communication</DialogTitle>
          <DialogDescription className="space-y-2">
            <p>
              Sends an in-app notification to the organizer and CM event members for this event ({recipientCount}{" "}
              {recipientCount === 1 ? "recipient" : "recipients"} loaded).
            </p>
            {eventId ? (
              <Button type="button" variant="link" className="h-auto p-0 text-primary justify-start" asChild>
                <Link to={`/dashboard/comments?hub=announcements&eventId=${eventId}`}>
                  Open Team Communication Hub (announcements) for this event
                </Link>
              </Button>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="team-msg-title">Subject</Label>
            <Input
              id="team-msg-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Parking update for load-in"
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-msg-body">Message</Label>
            <Textarea
              id="team-msg-body"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the message your stakeholders should see in Notifications."
              rows={5}
              maxLength={4000}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void send()} disabled={sending}>
            <Send className="h-4 w-4 mr-2" />
            {sending ? "Sending…" : "Send to team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

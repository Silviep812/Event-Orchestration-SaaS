import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";

export function InviteTesterDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-tester", {
        body: { email: trimmed },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Tester invitation sent to ${trimmed}`);
      setEmail("");
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send invitation";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Tester
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle>Invite a Tester</DialogTitle>
          <DialogDescription>
            Send a branded invitation from noreply@idaeventpartners.com. Testers get full app
            access.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tester-email">Tester email</Label>
            <Input
              id="tester-email"
              type="email"
              autoFocus
              required
              placeholder="tester@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={sending}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sending} className="gap-2">
              {sending && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

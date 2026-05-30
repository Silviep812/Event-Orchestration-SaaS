import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const USER_TYPES = [
  "Event Organizer",
  "Event Planner",
  "Venue Owner",
  "Hospitality Provider",
  "Host",
  "Partner",
] as const;

type MarketingWaitlistFormProps = {
  signupSource?: string;
  className?: string;
};

export function MarketingWaitlistForm({
  signupSource = "landing_home",
  className = "",
}: MarketingWaitlistFormProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [userType, setUserType] = useState<string>(USER_TYPES[0]);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const trimmed = email.trim();
    const { error } = await supabase.from("marketing_subscribers").insert({
      email: trimmed,
      name: name.trim() || null,
      organization: organization.trim() || null,
      user_type: userType,
      signup_source: signupSource,
    });
    if (error) {
      setLoading(false);
      const dup = error.message?.toLowerCase().includes("duplicate") || error.code === "23505";
      toast({
        variant: dup ? "default" : "destructive",
        title: dup ? "You're already on our list!" : "Could not subscribe",
        description: dup
          ? "We already have your email — we'll be in touch when we launch."
          : error.message || "Please try again in a moment.",
      });
      return;
    }

    trackEvent("waitlist_signup", { signup_source: signupSource, user_type: userType });

    // Fire-and-acknowledge: don't block UX if email transport fails.
    try {
      const { error: fnError } = await supabase.functions.invoke("send-waitlist-confirmation", {
        body: { email: trimmed },
      });
      if (fnError) {
        toast({
          variant: "default",
          title: "Thank you! We'll be in touch.",
          description: "You're on the list. (We couldn't send the confirmation email right now.)",
        });
      } else {
        toast({
          title: "Thank you! We'll be in touch.",
          description: "Check your inbox for a confirmation from Ida Event Partners.",
        });
      }
    } catch {
      toast({
        title: "Thank you! We'll be in touch.",
        description: "You're on the list.",
      });
    }

    setLoading(false);
    setEmail("");
    setName("");
    setOrganization("");
    setUserType(USER_TYPES[0]);
  };


  return (
    <form onSubmit={onSubmit} className={`space-y-4 text-left ${className}`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="waitlist-email">Work email</Label>
          <Input
            id="waitlist-email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="waitlist-name">Name (optional)</Label>
          <Input
            id="waitlist-name"
            autoComplete="name"
            placeholder="Alex Morgan"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="waitlist-org">Organization (optional)</Label>
          <Input
            id="waitlist-org"
            placeholder="Company or team"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>I am a…</Label>
          <Select value={userType} onValueChange={setUserType}>
            <SelectTrigger aria-label="Audience type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USER_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            Joining…
          </>
        ) : (
          "Get launch updates"
        )}
      </Button>
      <p className="text-xs text-muted-foreground leading-snug">
        By subscribing you agree we may email you about IEP. You can unsubscribe anytime. This form stores your details in
        our campaign database for the launch team.
      </p>
    </form>
  );
}

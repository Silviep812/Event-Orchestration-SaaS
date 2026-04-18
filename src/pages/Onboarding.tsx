import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MarketingTopBar } from "@/components/MarketingTopBar";
import { defaultProfileFromAuthUser } from "@/lib/defaultProfileFromAuthUser";
import { getPostSignInDashboardPath } from "@/lib/createEventEntryPath";
import { Loader2 } from "lucide-react";

/**
 * Lovable-style first-time flow: confirm profile + planner fields, then continue to the app.
 * Completes by setting `profiles.onboarding_completed_at` (see migration).
 */
export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [userCategory, setUserCategory] = useState("");
  const [userType, setUserType] = useState("");
  const [saving, setSaving] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);

  useEffect(() => {
    document.title = "Welcome | IEP";
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    const meta = user.user_metadata ?? {};
    setUserCategory(typeof meta.user_category === "string" ? meta.user_category : "");
    setUserType(typeof meta.user_type === "string" ? meta.user_type : "");

    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, username, onboarding_completed_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.onboarding_completed_at) {
        navigate(await getPostSignInDashboardPath(supabase), { replace: true });
        return;
      }

      const defaults = defaultProfileFromAuthUser(user);
      setDisplayName((data?.display_name ?? defaults.display_name).trim());
      setUsername((data?.username ?? defaults.username).trim());
      setBootLoading(false);
    })();
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    const dn = displayName.trim();
    const un = username.trim().replace(/[^a-zA-Z0-9._-]/g, "");
    const cat = userCategory.trim();
    const typ = userType.trim();

    if (!dn || !un) {
      toast({
        variant: "destructive",
        title: "Required fields",
        description: "Please enter a display name and a username (letters, numbers, . _ -).",
      });
      return;
    }
    if (!cat || !typ) {
      toast({
        variant: "destructive",
        title: "Required fields",
        description: "Please enter your category and planner type.",
      });
      return;
    }

    setSaving(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: dn,
          username: un,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (profileError) {
        toast({
          variant: "destructive",
          title: "Could not save profile",
          description: profileError.message,
        });
        return;
      }

      const { error: metaError } = await supabase.auth.updateUser({
        data: { user_category: cat, user_type: typ },
      });

      if (metaError) {
        toast({
          variant: "destructive",
          title: "Profile saved; metadata update failed",
          description: metaError.message,
        });
      }

      window.dispatchEvent(new Event("profileUpdated"));
      toast({ title: "You're all set", description: "Taking you to your workspace." });
      navigate(await getPostSignInDashboardPath(supabase), { replace: true });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || bootLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <MarketingTopBar page="home" />
        <div className="flex flex-1 items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/40 to-background">
      <MarketingTopBar page="home" />
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-lg shadow-lg border-border/80">
          <CardHeader>
            <CardTitle className="text-2xl">Set up your profile</CardTitle>
            <CardDescription>
              Confirm how you&apos;ll appear in the app and tell us a bit about your planning role. You can change
              this later in Account settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="onb-display">Display name</Label>
                <Input
                  id="onb-display"
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="onb-username">Username</Label>
                <Input
                  id="onb-username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">Letters, numbers, periods, underscores, and hyphens.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="onb-category">Your category</Label>
                <Input
                  id="onb-category"
                  autoComplete="organization-title"
                  placeholder="e.g. Corporate, Wedding, Nonprofit"
                  value={userCategory}
                  onChange={(e) => setUserCategory(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="onb-type">Your planner type</Label>
                <Input
                  id="onb-type"
                  autoComplete="off"
                  placeholder="e.g. Event planner, Host, Coordinator"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Continue to dashboard"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

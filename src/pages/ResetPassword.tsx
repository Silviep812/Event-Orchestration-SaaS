import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { MarketingTopBar } from "@/components/MarketingTopBar";
import { supabase } from "@/integrations/supabase/client";
import { AUTH_RESET_PASSWORD_REQUEST_PATH } from "@/lib/authRoutes";

type LinkState = "checking" | "ready" | "invalid";

const RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
  { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

/**
 * Dedicated landing page for Supabase recovery links.
 *
 * Recovery used to point at `/dashboard/profile`, which is behind `ProtectedRoute` and gives no
 * indication that a new password is expected — testers reported password reset as broken. This
 * screen owns the recovery session, tells the user plainly when a link has expired or was opened
 * in a different browser (PKCE keeps its verifier in the originating browser), and offers a way to
 * request a fresh link.
 */
export default function ResetPassword() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || session) setLinkState("ready");
    });

    void (async () => {
      // `detectSessionInUrl` consumes ?code / #access_token before this runs in most cases; give it
      // a moment, then fall back to whatever session exists.
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        setLinkState("ready");
        return;
      }
      window.setTimeout(async () => {
        if (cancelled) return;
        const { data: retry } = await supabase.auth.getSession();
        if (cancelled) return;
        setLinkState(retry.session ? "ready" : "invalid");
      }, 1200);
    })();

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const failedRules = RULES.filter((r) => !r.test(password));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (failedRules.length > 0) {
      toast({
        variant: "destructive",
        title: "Password is too weak",
        description: failedRules.map((r) => r.label).join(", "),
      });
      return;
    }
    if (password !== confirm) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Make sure both fields are identical.",
      });
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      toast({ variant: "destructive", title: "Could not update password", description: error.message });
      return;
    }

    toast({ title: "Password updated", description: "You can now sign in with your new password." });
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketingTopBar page="auth" />
      <div className="flex-1 flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Set a new password</CardTitle>
            <CardDescription>Choose a password you haven't used on this account before.</CardDescription>
          </CardHeader>
          <CardContent>
            {linkState === "checking" && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
                <p className="text-sm text-muted-foreground">Checking your reset link…</p>
              </div>
            )}

            {linkState === "invalid" && (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  This reset link is no longer valid. Reset links expire, can only be used once, and must be opened in
                  the same browser that requested them.
                </p>
                <Button asChild className="w-full">
                  <Link to={AUTH_RESET_PASSWORD_REQUEST_PATH}>Send me a new reset link</Link>
                </Button>
              </div>
            )}

            {linkState === "ready" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-new-password">New password</Label>
                  <div className="relative">
                    <Input
                      id="reset-new-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                    </Button>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs" aria-live="polite">
                    {RULES.map((rule) => {
                      const ok = rule.test(password);
                      return (
                        <li
                          key={rule.label}
                          className={`flex items-center gap-2 ${ok ? "text-green-600" : "text-muted-foreground"}`}
                        >
                          {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          <span>{rule.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reset-confirm-password">Confirm new password</Label>
                  <Input
                    id="reset-confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Updating…" : "Update password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

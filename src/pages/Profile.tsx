import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, resetPassword } = useAuth();
  const { toast } = useToast();

  // Debug logging
  console.log("Profile component rendering, user:", user);
  console.log("Profile component user email:", user?.email);
  console.log("Profile component user id:", user?.id);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Basic SEO for this page
    document.title = "Account Settings | IEP";
    const desc = "Manage your IEP account and update your password.";

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", window.location.href);
  }, []);

  const handleSendResetEmail = async () => {
    if (!user?.email) {
      toast({ title: "No email found", description: "Your account email could not be determined." });
      return;
    }
    const { error } = await resetPassword(user.email);
    if (error) {
      toast({ title: "Reset failed", description: error.message || "Could not send reset email.", variant: "destructive" });
      return;
    }
    toast({ title: "Reset email sent", description: "Check your inbox for the password reset link." });
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) {
      toast({ title: "Not signed in", description: "Please sign in again.", variant: "destructive" });
      return;
    }

    if (newPassword.length < 8) {
      toast({ title: "Weak password", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", description: "Make sure both passwords match.", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);

      // Optional verification step if the user provided current password
      if (currentPassword) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });
        if (verifyError) {
          toast({ title: "Current password incorrect", description: "Please try again.", variant: "destructive" });
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast({ title: "Update failed", description: error.message || "Could not update password.", variant: "destructive" });
        setLoading(false);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile and security.</p>
      </header>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Basic account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} readOnly />
            </div>
            <div className="grid gap-2">
              <Label>User ID</Label>
              <Input value={user?.id || ""} readOnly />
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Set / Change Password</CardTitle>
            <CardDescription>
              {"Create a new password or update your existing one. Use at least 8 characters."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current">Current password (optional)</Label>
                <Input
                  id="current"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="new">New password</Label>
                <Input
                  id="new"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Password"}
                </Button>
                <Button type="button" variant="outline" onClick={handleSendResetEmail}>
                  Send Reset Email
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default Profile;

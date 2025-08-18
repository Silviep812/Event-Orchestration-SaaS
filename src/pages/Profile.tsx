import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Debug logging
  console.log("Profile component rendering, user:", user);
  console.log("Profile component user email:", user?.email);
  console.log("Profile component user id:", user?.id);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Profile data state
  const [profile, setProfile] = useState({
    username: "",
    display_name: "",
    bio: ""
  });

  // Load user profile
  useEffect(() => {
    if (user?.id) {
      loadUserProfile();
    }
  }, [user?.id]);

  useEffect(() => {
    // If user is not authenticated, redirect to dashboard
    if (!user) {
      navigate('/dashboard');
      return;
    }

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
  }, [user, navigate]);

  const loadUserProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, display_name, bio')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        toast({
          title: "Error loading profile",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (data) {
        setProfile({
          username: data.username || "",
          display_name: data.display_name || "",
          bio: data.bio || ""
        });
      } else {
        // Create profile if it doesn't exist
        await createUserProfile();
      }
    } catch (err: any) {
      console.error('Error in loadUserProfile:', err);
    }
  };

  const createUserProfile = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          username: "idaeventpartners.com",
          display_name: user.email?.split('@')[0] || "User"
        });

      if (error) {
        console.error('Error creating profile:', error);
        return;
      }

      // Reload the profile
      await loadUserProfile();
    } catch (err: any) {
      console.error('Error in createUserProfile:', err);
    }
  };

  const updateProfile = async () => {
    if (!user?.id) return;

    setProfileLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          display_name: profile.display_name,
          bio: profile.bio
        })
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Update failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong.",
        variant: "destructive"
      });
    } finally {
      setProfileLoading(false);
    }
  };

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
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Manage your profile details and account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profile.username}
                onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter your username"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={profile.display_name}
                onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="Enter your display name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself"
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} readOnly />
            </div>
            <Button onClick={updateProfile} disabled={profileLoading}>
              {profileLoading ? "Updating..." : "Update Profile"}
            </Button>
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

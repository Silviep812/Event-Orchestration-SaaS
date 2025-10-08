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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload } from "lucide-react";

const Profile = () => {
  const { user, resetPassword, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Debug logging
  console.log("Profile component rendering, user:", user);
  console.log("Profile component user email:", user?.email);
  console.log("Profile component user id:", user?.id);
  console.log("Profile component loading:", loading);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Profile data state
  const [profile, setProfile] = useState({
    username: "",
    display_name: "",
    bio: "",
    avatar_url: ""
  });
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Show loading while auth is initializing
  if (loading) {
    return (
      <main className="mx-auto max-w-3xl space-y-6">
        <div className="text-center">Loading...</div>
      </main>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    navigate('/auth');
    return null;
  }

  // Load user profile
  useEffect(() => {
    if (user?.id) {
      loadUserProfile();
    }
  }, [user?.id]);

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
  }, [user, navigate]);

  const loadUserProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, display_name, bio, avatar_url')
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
          bio: data.bio || "",
          avatar_url: data.avatar_url || ""
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
      console.log("Creating profile for user:", user.id);
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          username: "idaeventpartners.com",
          display_name: "IDA Event Partners"
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        toast({
          title: "Error creating profile",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log("Profile created successfully:", data);
      // Set the profile state immediately
      setProfile({
        username: "idaeventpartners.com",
        display_name: "IDA Event Partners",
        bio: "",
        avatar_url: ""
      });
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
          bio: profile.bio,
          avatar_url: profile.avatar_url
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setAvatarUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete existing avatar if any
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache-busting query param
      const avatarUrl = urlData.publicUrl + `?t=${Date.now()}`;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));

      // Reload profile from database to ensure latest avatar_url
      await loadUserProfile();

      // Dispatch custom event to update header avatar
      window.dispatchEvent(new Event('profileUpdated'));

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully."
      });

    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload avatar.",
        variant: "destructive"
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) {
      toast({ 
        title: "No email found", 
        description: "Your account email could not be determined.",
        variant: "destructive" 
      });
      return;
    }
    
    console.log('Sending reset email to:', user.email);
    
    try {
      const { error } = await resetPassword(user.email);
      
      if (error) {
        console.error('Reset email error:', error);
        toast({ 
          title: "Reset failed", 
          description: error.message || "Could not send reset email.", 
          variant: "destructive" 
        });
        return;
      }
      
      toast({ 
        title: "Reset email sent", 
        description: "Check your inbox for the password reset link. You will be redirected back to this page." 
      });
    } catch (err: any) {
      console.error('Reset email exception:', err);
      toast({ 
        title: "Error", 
        description: "Could not send reset email. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.email) {
      toast({ title: "Not signed in", description: "Please sign in again.", variant: "destructive" });
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      toast({ title: "Weak password", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", description: "Make sure both passwords match.", variant: "destructive" });
      return;
    }

    setPasswordLoading(true);
    
    try {
      console.log('Attempting to update password for user:', user.id);
      
      const { data, error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      console.log('Password update result:', { data, error });
      
      if (error) {
        console.error('Password update error:', error);
        toast({ 
          title: "Update failed", 
          description: error.message, 
          variant: "destructive" 
        });
        return;
      }

      // Clear form fields on success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      toast({ 
        title: "Password updated successfully", 
        description: "Your password has been changed." 
      });
      
    } catch (err: any) {
      console.error('Password update exception:', err);
      toast({ 
        title: "Unexpected error", 
        description: "Something went wrong. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setPasswordLoading(false);
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
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url} alt="Profile picture" />
                <AvatarFallback className="text-lg">
                  {profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-2">
                <Label htmlFor="avatar">Profile Picture</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={avatarUploading}
                    className="cursor-pointer"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={avatarUploading}
                    onClick={() => document.getElementById('avatar')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {avatarUploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  PNG, JPG up to 5MB. Avatar will be displayed publicly.
                </p>
              </div>
            </div>
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
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your account password. Use at least 8 characters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current">Current password</Label>
                <Input
                  id="current"
                  type="password"
                  placeholder="Enter current password (leave blank if unknown)"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <p className="text-sm text-muted-foreground">
                  Leave blank if you don't know your current password - you can still update it.
                </p>
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
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? "Updating..." : "Update Password"}
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

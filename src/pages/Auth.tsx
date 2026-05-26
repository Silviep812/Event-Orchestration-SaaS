import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { getAuthErrorDescription } from '@/lib/authErrors';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import { MarketingTopBar } from '@/components/MarketingTopBar';
import { supabase } from '@/integrations/supabase/client';
import { getPostSignInNavigationPath } from '@/lib/profileOnboardingGate';
import { PRICING_TIERS_SUMMARY } from "@/lib/pricingSummaryCopy";
import { recordMarketingTrialConversion } from "@/lib/recordMarketingTrialConversion";

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  /** Collected at sign-up; stored on the auth user record (metadata) for profile and offers. */
  const [userCategory, setUserCategory] = useState('');
  const [userType, setUserType] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  
  const { signIn, signUp, resetPassword, signInWithMagicLink, signInWithOAuth, user } = useAuth();
  const oauthEnabled = import.meta.env.VITE_ENABLE_OAUTH === "true";
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const path = await getPostSignInNavigationPath(supabase);
      if (cancelled) return;
      navigate(path, { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error, user: newUser } = await signUp(email, password, {
      user_category: userCategory,
      user_type: userType,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: getAuthErrorDescription(error),
      });
    } else {
      if (newUser?.id) {
        void recordMarketingTrialConversion(supabase, newUser.id);
      }
      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link to complete your registration.",
      });
    }
    
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await resetPassword(resetEmail);
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: getAuthErrorDescription(error),
      });
    } else {
      toast({
        title: "Password reset sent",
        description: "Check your email for password reset instructions.",
      });
      setResetEmail('');
    }
    
    setLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signInWithMagicLink(magicLinkEmail);
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Magic link failed",
        description: getAuthErrorDescription(error),
      });
    } else {
      toast({
        title: "Magic link sent!",
        description: "Check your email for a secure sign-in link (no password needed).",
      });
      setMagicLinkEmail('');
    }
    
    setLoading(false);
  };

  const handleOAuth = async (provider: "google" | "linkedin_oidc") => {
    setLoading(true);
    const { error } = await signInWithOAuth(provider);
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign-in with provider failed",
        description: error.message,
      });
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <MarketingTopBar page="auth" />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-muted/30 p-6 text-center">
          <Loader2 className="h-9 w-9 animate-spin text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground max-w-sm">
            Taking you to the right place in your workspace…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketingTopBar page="auth" />
      <div className="flex-1 flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to IEP</CardTitle>
            <CardDescription className="space-y-2">
              <span className="block">Sign in to your account or create a new one to get started.</span>
              <span className="block text-xs leading-snug text-muted-foreground">{PRICING_TIERS_SUMMARY}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="magic">Magic Link</TabsTrigger>
                <TabsTrigger value="reset">Reset</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      autoComplete="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter your password"
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
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                  {oauthEnabled && (
                    <>
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          disabled={loading}
                          onClick={() => handleOAuth("google")}
                        >
                          Google
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          disabled={loading}
                          onClick={() => handleOAuth("linkedin_oidc")}
                        >
                          LinkedIn
                        </Button>
                      </div>
                    </>
                  )}
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-category">Your category</Label>
                    <Input
                      id="signup-category"
                      type="text"
                      autoComplete="organization-title"
                      placeholder="e.g. Corporate, Wedding, Nonprofit"
                      value={userCategory}
                      onChange={(e) => setUserCategory(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Helps us tailor your experience.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-type">Your planner type</Label>
                    <Input
                      id="signup-type"
                      type="text"
                      autoComplete="off"
                      placeholder="e.g. Event planner, Host, Coordinator"
                      value={userType}
                      onChange={(e) => setUserType(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {(() => {
                      const reqs = [
                        { label: "At least 8 characters", ok: password.length >= 8 },
                        { label: "One uppercase letter", ok: /[A-Z]/.test(password) },
                        { label: "One number", ok: /\d/.test(password) },
                        { label: "One special character", ok: /[^A-Za-z0-9]/.test(password) },
                      ];
                      return (
                        <ul className="mt-2 space-y-1 text-xs" aria-live="polite">
                          {reqs.map((r) => (
                            <li
                              key={r.label}
                              className={`flex items-center gap-2 ${r.ok ? "text-green-600" : "text-muted-foreground"}`}
                            >
                              {r.ok ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <X className="h-3.5 w-3.5" />
                              )}
                              <span>{r.label}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    })()}
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      loading ||
                      password.length < 8 ||
                      !/[A-Z]/.test(password) ||
                      !/\d/.test(password) ||
                      !/[^A-Za-z0-9]/.test(password)
                    }
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>

                </form>
              </TabsContent>
              
              <TabsContent value="magic">
                <div className="space-y-4">
                  <div className="text-center text-sm text-muted-foreground mb-4">
                    No password needed! We'll send you a secure link to sign in instantly.
                  </div>
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="magic-email">Email</Label>
                      <Input
                        id="magic-email"
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your email"
                        value={magicLinkEmail}
                        onChange={(e) => setMagicLinkEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Sending..." : "Send Magic Link"}
                    </Button>
                  </form>
                </div>
              </TabsContent>

              <TabsContent value="reset">
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
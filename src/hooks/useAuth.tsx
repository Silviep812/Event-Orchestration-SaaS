import React, { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRoles: string[];
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  signInWithMagicLink: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);

      if (error) {
        setUserRoles([]);
        return;
      }

      setUserRoles(data?.map((item) => item.role) || []);
    } catch (error) {
      setUserRoles([]);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const applySession = async (nextSession: Session | null) => {
      if (cancelled) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        await fetchUserRoles(nextSession.user.id);
      } else {
        setUserRoles([]);
      }

      if (!cancelled) {
        setLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    void supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          if (!cancelled) {
            setLoading(false);
          }
          return;
        }

        return applySession(session);
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/dashboard/profile`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const signInWithMagicLink = async (email: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    userRoles,
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInWithMagicLink,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return a safe default during HMR/initialization instead of crashing
    return {
      user: null,
      session: null,
      loading: true,
      userRoles: [] as string[],
      signIn: async () => ({ error: new Error("Auth not ready") }),
      signUp: async () => ({ error: new Error("Auth not ready") }),
      signOut: async () => ({ error: new Error("Auth not ready") }),
      resetPassword: async () => ({ error: new Error("Auth not ready") }),
      signInWithMagicLink: async () => ({ error: new Error("Auth not ready") }),
    } as AuthContextType;
  }
  return context;
}

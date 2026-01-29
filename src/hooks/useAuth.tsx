import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

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
      console.log('useAuth: Starting fetchUserRoles for user:', userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) {
        console.error('useAuth: Error fetching user roles:', error);
        setUserRoles([]);
        return;
      }
      
      console.log('useAuth: Fetched user roles:', data);
      setUserRoles(data?.map(item => item.role) || []);
    } catch (error) {
      console.error('useAuth: Exception in fetchUserRoles:', error);
      setUserRoles([]);
    }
  };

  useEffect(() => {
    console.log('useAuth: Starting auth initialization');

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('useAuth: Auth state changed', { event, hasSession: !!session, hasUser: !!session?.user });
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetching to avoid auth deadlock
        if (session?.user) {
          console.log('useAuth: Deferring role fetch for user:', session.user.id);
          setTimeout(() => {
            fetchUserRoles(session.user.id);
          }, 0);
        } else {
          setUserRoles([]);
        }
        
        console.log('useAuth: Setting loading to false from auth state change');
        setLoading(false);
      }
    );

    // THEN check for existing session
    console.log('useAuth: Checking for existing session');
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      console.log('useAuth: Got session result', { hasSession: !!session, hasUser: !!session?.user, error });
      
      if (error) {
        console.error('useAuth: Error getting session:', error);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('useAuth: Fetching user roles for existing session user:', session.user.id);
        // Use setTimeout to prevent potential auth deadlock
        setTimeout(() => {
          fetchUserRoles(session.user.id);
        }, 0);
      }
      
      console.log('useAuth: Setting loading to false from session check');
      setLoading(false);
    }).catch((error) => {
      console.error('useAuth: Session check failed:', error);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
        emailRedirectTo: redirectUrl
      }
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
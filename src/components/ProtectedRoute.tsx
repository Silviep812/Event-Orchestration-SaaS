import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      if (loading) {
        setVerifying(true);
        return;
      }

      if (user) {
        setVerifying(false);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      const hasSession = !!data?.session?.user;
      console.info('ProtectedRoute: verification', { hasSession, error: error?.message });

      if (cancelled) return;

      if (hasSession) {
        setVerifying(false);
      } else {
        navigate('/auth', { replace: true, state: { from: location.pathname } });
      }
    };

    verifySession();
    return () => {
      cancelled = true;
    };
  }, [user, loading, navigate, location.pathname]);

  if (loading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}

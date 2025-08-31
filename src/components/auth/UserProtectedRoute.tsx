import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Loader2 } from 'lucide-react';

interface UserProtectedRouteProps {
  children: React.ReactNode;
}

const UserProtectedRoute: React.FC<UserProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const { session } = useSupabaseAuth(); // Enhanced auth hook
  const location = useLocation();
  const navigate = useNavigate();

  // Enhanced session validation
  useEffect(() => {
    if (!isLoading && isAuthenticated && !session) {
      console.warn('[UserProtectedRoute] Auth state mismatch - logging out');
      useAuthStore.getState().logout();
    }
  }, [isAuthenticated, session, isLoading]);

  // Role-based redirection with preserved location
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === 'admin') {
        const intendedPath = location.state?.from || '/admin/dashboard';
        navigate(intendedPath, { replace: true });
      }
    }
  }, [isAuthenticated, user, isLoading, navigate, location.state]);

  // Enhanced loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-system">
            Verificando autenticação...
          </p>
          <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-pulse rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced authentication check
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/entrar" 
        state={{ 
          from: location.pathname,
          message: session ? undefined : 'Sessão expirada. Faça login novamente.' 
        }} 
        replace 
      />
    );
  }

  // Admin redirect is handled in useEffect
  if (user && user.role === 'admin') {
    return null; // Will redirect via useEffect
  }

  // Render protected content for authenticated users
  return <>{children}</>;
};

export default UserProtectedRoute;
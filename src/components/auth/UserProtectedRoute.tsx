import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2 } from 'lucide-react';

interface UserProtectedRouteProps {
  children: React.ReactNode;
}

const UserProtectedRoute: React.FC<UserProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Role-based redirection
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === 'admin') {
        const intendedPath = location.state?.from || '/admin/dashboard';
        navigate(intendedPath, { replace: true });
      }
    }
  }, [isAuthenticated, user, isLoading, navigate, location.state]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-system">
            Verificando autenticação...
          </p>
        </div>
      </div>
    );
  }

  // Authentication check
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/entrar" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Admin redirect
  if (user && user.role === 'admin') {
    return null;
  }

  return <>{children}</>;
};

export default UserProtectedRoute;
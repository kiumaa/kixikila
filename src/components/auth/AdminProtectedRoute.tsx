import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user, isLoading, initializeAuth } = useAuthStore();
  const location = useLocation();
  const [authInitialized, setAuthInitialized] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      await initializeAuth();
      setAuthInitialized(true);
    };
    
    if (!authInitialized) {
      initAuth();
    }
  }, [initializeAuth, authInitialized]);

  // Show loading spinner while checking authentication
  if (isLoading || !authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-system">
            Verificando permissões de admin...
          </p>
        </div>
      </div>
    );
  }

  // For admin login page, always show the admin login (don't redirect)
  if (location.pathname === '/admin' && !isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated, redirect to admin login
  if (!isAuthenticated) {
    return <Navigate to="/admin" state={{ from: location.pathname }} replace />;
  }

  // If authenticated but not admin, redirect to user area
  if (user && user.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  // If admin, render the protected content
  return <>{children}</>;
};

export default AdminProtectedRoute;
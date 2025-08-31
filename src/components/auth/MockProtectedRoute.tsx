import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useMockAuthStore } from '@/stores/useMockAuthStore';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';

interface MockProtectedRouteProps {
  children: React.ReactNode;
}

const MockProtectedRoute: React.FC<MockProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useMockAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner />
          <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Check if user has PIN setup (for demo purposes)
  const hasPin = localStorage.getItem('mock_user_pin');
  
  if (!isAuthenticated || !user) {
    // Redirect to mock login with return path
    return <Navigate 
      to={`/auth/login?redirect=${encodeURIComponent(location.pathname)}`} 
      replace 
    />;
  }

  // If authenticated but no PIN, redirect to PIN setup
  if (!hasPin) {
    return <Navigate to="/auth/set-pin" replace />;
  }

  return <>{children}</>;
};

export default MockProtectedRoute;
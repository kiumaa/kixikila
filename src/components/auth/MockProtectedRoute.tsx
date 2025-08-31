import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useMockAuthStore } from '@/stores/useMockAuthStore';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';
import { useTrustedDevice } from '@/hooks/useTrustedDevice';
import { usePinManagement } from '@/hooks/usePinManagement';

interface MockProtectedRouteProps {
  children: React.ReactNode;
}

const MockProtectedRoute: React.FC<MockProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useMockAuthStore();
  const { isTrustedDevice, isDeviceLocked } = useTrustedDevice();
  const { hasPinConfigured } = usePinManagement();
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

  if (!isAuthenticated || !user) {
    // Redirect to mock login with return path
    return <Navigate 
      to={`/auth/login?redirect=${encodeURIComponent(location.pathname)}`} 
      replace 
    />;
  }

  // Check PIN configuration and device trust
  const hasPin = hasPinConfigured(user.id);
  const isTrusted = isTrustedDevice(user.id);
  const isLocked = isDeviceLocked(user.id);

  // If authenticated but no PIN configured, redirect to PIN setup
  if (!hasPin) {
    return <Navigate to="/auth/set-pin" replace />;
  }

  // If device is locked or not trusted, redirect to login
  if (isLocked || !isTrusted) {
    return <Navigate 
      to={`/auth/login?redirect=${encodeURIComponent(location.pathname)}`} 
      replace 
    />;
  }

  return <>{children}</>;
};

export default MockProtectedRoute;
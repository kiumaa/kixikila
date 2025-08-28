import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingScreen } from '@/components/screens/LoadingScreen';
import { useAuthStore } from '@/stores/useAuthStore';
import AppRoutes from '@/routes/AppRoutes';

const AppPage = () => {
  const { isAuthenticated } = useAuthStore();
  
  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    return <Navigate to="/entrar" replace />;
  }

  return (
    <ErrorBoundary>
      <div className="max-w-md mx-auto bg-background min-h-screen relative">
        <AppRoutes />
      </div>
    </ErrorBoundary>
  );
};

export default AppPage;
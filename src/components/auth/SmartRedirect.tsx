import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2 } from 'lucide-react';

interface SmartRedirectProps {
  fallback?: string;
}

/**
 * Smart redirect component that analyzes user state and redirects accordingly:
 * - New users (first_login) → /onboarding
 * - Users without KYC → /kyc
 * - Admin users → /admin/dashboard  
 * - Regular users → /app/dashboard
 */
const SmartRedirect: React.FC<SmartRedirectProps> = ({ 
  fallback = '/app/dashboard' 
}) => {
  const { isAuthenticated, isLoading, getNextRoute } = useAuthStore();

  // Show loading while determining route
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-system">
            Redirecionando...
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, go to login
  if (!isAuthenticated) {
    return <Navigate to="/entrar" replace />;
  }

  // Use intelligent routing
  const nextRoute = getNextRoute();
  
  return <Navigate to={nextRoute || fallback} replace />;
};

export default SmartRedirect;
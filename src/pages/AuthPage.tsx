import React, { useState, useEffect, Suspense } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { LoginScreen, RegisterScreen } from '@/routes/LazyRoutes';
import { Loader2 } from 'lucide-react';

const AuthPage = () => {
  const { isAuthenticated } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [authType, setAuthType] = useState<'login' | 'register'>('login');

  // Get auth type from URL params or default to login
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'register') {
      setAuthType('register');
    } else {
      setAuthType('login'); 
    }
  }, [searchParams]);

  // Redirect authenticated users based on role
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const handleSuccess = () => {
    // Redirection is now handled by the auth store based on user role
  };

  const handleBack = () => {
    window.location.href = '/';
  };

  const handleRegister = () => {
    setAuthType('register');
    window.history.pushState({}, '', '/entrar?type=register');
  };

  const handleLogin = () => {
    setAuthType('login');
    window.history.pushState({}, '', '/entrar?type=login');
  };

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      <Suspense 
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-system">
                Carregando...
              </p>
            </div>
          </div>
        }
      >
        {authType === 'login' ? (
          <LoginScreen
            onBack={handleBack}
            onSuccess={handleSuccess}
            onRegister={handleRegister}
          />
        ) : (
          <RegisterScreen
            onBack={handleBack}
            onSuccess={handleSuccess}
          />
        )}
      </Suspense>
    </div>
  );
};

export default AuthPage;
import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { LoginScreen, RegisterScreen } from '@/routes/LazyRoutes';

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

  // Redirect authenticated users to app
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const handleSuccess = () => {
    window.location.href = '/app';
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
    </div>
  );
};

export default AuthPage;
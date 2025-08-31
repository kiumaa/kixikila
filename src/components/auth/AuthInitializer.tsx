import React, { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';

const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return <>{children}</>;
};

export default AuthInitializer;
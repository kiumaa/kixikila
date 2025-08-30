/**
 * Mock Supabase Authentication Hook for Development
 * 
 * This is a simplified version for the demo that simulates authentication
 */

import React from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { mockUser } from '@/lib/mockData';

export const useSupabaseAuth = () => {
  const { user, isAuthenticated, isLoading, error } = useAuthStore();

  React.useEffect(() => {
    // Simulate logged in user for demo
    const initializeMockAuth = () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          full_name: mockUser.full_name,
          name: mockUser.name,
          phone: mockUser.phone,
          role: 'user',
          is_vip: mockUser.is_vip,
          email_verified: true,
          phone_verified: true,
          avatar_url: mockUser.avatar_url,
          created_at: mockUser.created_at
        },
        isLoading: false,
        error: null,
      });
    };

    // Initialize after a short delay
    const timer = setTimeout(initializeMockAuth, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    session: null,
  };
};

export default useSupabaseAuth;
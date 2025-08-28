/**
 * Custom hook for Supabase Authentication
 * 
 * This hook provides authentication state management and listens to
 * Supabase auth state changes to keep the app in sync.
 */

import { useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import supabaseAuthService from '../services/supabaseAuthService';

export const useSupabaseAuth = () => {
  const { initializeAuth, user, isAuthenticated, isLoading, error } = useAuthStore();

  useEffect(() => {
    // Initialize auth state on mount
    initializeAuth();

    // Listen to auth state changes
    const { data: { subscription } } = supabaseAuthService.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        // Prevent calling Supabase functions inside onAuthStateChange to avoid deadlock
        setTimeout(async () => {
          try {
            switch (event) {
              case 'SIGNED_IN':
                // User signed in
                if (session?.user) {
                  const userData = await supabaseAuthService.getCurrentUser();
                  useAuthStore.setState({
                    isAuthenticated: true,
                    user: userData,
                    isLoading: false,
                    error: null,
                  });
                }
                break;
                
              case 'SIGNED_OUT':
                // User signed out
                useAuthStore.setState({
                  isAuthenticated: false,
                  user: null,
                  isLoading: false,
                  error: null,
                });
                break;
                
              case 'TOKEN_REFRESHED':
                // Token was refreshed
                if (session?.user) {
                  const userData = await supabaseAuthService.getCurrentUser();
                  useAuthStore.setState({
                    user: userData,
                    isLoading: false,
                    error: null,
                  });
                }
                break;
                
              case 'USER_UPDATED':
                // User data was updated
                if (session?.user) {
                  const userData = await supabaseAuthService.getCurrentUser();
                  useAuthStore.setState({
                    user: userData,
                    isLoading: false,
                    error: null,
                  });
                }
                break;
                
              default:
                break;
            }
          } catch (error) {
            console.error('Error in auth state change handler:', error);
          }
        }, 0);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, [initializeAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
  };
};

export default useSupabaseAuth;
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
    console.log('[useSupabaseAuth] Initializing auth hook...');
    
    // Initialize auth state on mount
    initializeAuth();

    // Check for existing session immediately
    const checkExistingSession = async () => {
      try {
        console.log('[useSupabaseAuth] Checking existing session...');
        const session = await supabaseAuthService.getCurrentSession();
        
        if (session?.user) {
          console.log('[useSupabaseAuth] Found existing session for user:', session.user.email);
          const userData = await supabaseAuthService.getCurrentUser();
          useAuthStore.setState({
            isAuthenticated: true,
            user: userData,
            isLoading: false,
            error: null,
          });
        } else {
          console.log('[useSupabaseAuth] No existing session found');
          useAuthStore.setState({
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('[useSupabaseAuth] Error checking session:', error);
        useAuthStore.setState({
          isLoading: false,
          error: 'Erro ao verificar sessão',
        });
      }
    };

    checkExistingSession();

    // Listen to auth state changes
    const { data: { subscription } } = supabaseAuthService.onAuthStateChange(
      async (event, session) => {
        console.log('[useSupabaseAuth] Auth state changed:', event, !!session, session?.user?.email);
        
        // Prevent calling Supabase functions inside onAuthStateChange to avoid deadlock
        setTimeout(async () => {
          try {
            switch (event) {
              case 'SIGNED_IN':
                console.log('[useSupabaseAuth] Processing SIGNED_IN event');
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
                console.log('[useSupabaseAuth] Processing SIGNED_OUT event');
                useAuthStore.setState({
                  isAuthenticated: false,
                  user: null,
                  isLoading: false,
                  error: null,
                });
                break;
                
              case 'TOKEN_REFRESHED':
                console.log('[useSupabaseAuth] Processing TOKEN_REFRESHED event');
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
                console.log('[useSupabaseAuth] Processing USER_UPDATED event');
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
                console.log('[useSupabaseAuth] Unhandled auth event:', event);
                break;
            }
          } catch (error) {
            console.error('[useSupabaseAuth] Error in auth state change handler:', error);
            useAuthStore.setState({
              isLoading: false,
              error: 'Erro na autenticação',
            });
          }
        }, 0);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log('[useSupabaseAuth] Cleaning up auth subscription');
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
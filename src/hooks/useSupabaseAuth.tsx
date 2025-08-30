/**
 * Enhanced Supabase Authentication Hook
 * 
 * This hook provides secure authentication state management with proper
 * session handling, deadlock prevention, and error recovery.
 */

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

export const useSupabaseAuth = () => {
  const { user, isAuthenticated, isLoading, error } = useAuthStore();
  const [session, setSession] = useState<Session | null>(null);
  const initializationRef = useRef(false);

  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    console.log('[useSupabaseAuth] Initializing enhanced auth hook...');
    
    let mounted = true;

    const initializeAuth = async () => {
      try {
        useAuthStore.setState({ isLoading: true, error: null });

        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (!mounted) return;

            console.log('[useSupabaseAuth] Auth state changed:', event, !!session?.user);
            
            // Update session state immediately (synchronous)
            setSession(session);

            // Update auth store state (synchronous)
            if (event === 'SIGNED_OUT' || !session) {
              useAuthStore.setState({
                isAuthenticated: false,
                user: null,
                isLoading: false,
                error: null,
              });
            } else if (session?.user) {
              // Defer user profile fetch to avoid deadlock
              setTimeout(async () => {
                if (!mounted) return;

                try {
                  // Get user profile from our custom users table
                  const { data: userProfile, error: profileError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                  if (!mounted) return;

                  if (profileError) {
                    console.error('Error fetching user profile:', profileError);
                    useAuthStore.setState({
                      isAuthenticated: true,
                      user: {
                        id: session.user.id,
                        email: session.user.email || '',
                        full_name: session.user.user_metadata?.full_name || 'Usuário',
                        phone: session.user.phone,
                        role: session.user.user_metadata?.role || 'user',
                        email_verified: !!session.user.email_confirmed_at,
                        phone_verified: !!session.user.phone_confirmed_at,
                      },
                      isLoading: false,
                      error: null,
                    });
                  } else {
                    useAuthStore.setState({
                      isAuthenticated: true,
                      user: {
                        id: userProfile.id,
                        email: userProfile.email,
                        full_name: userProfile.full_name,
                        phone: userProfile.phone,
                        role: userProfile.role,
                        is_vip: userProfile.is_vip,
                        email_verified: userProfile.email_verified,
                        phone_verified: userProfile.phone_verified,
                        avatar_url: userProfile.avatar_url,
                        created_at: userProfile.created_at,
                        updated_at: userProfile.updated_at,
                      },
                      isLoading: false,
                      error: null,
                    });
                  }
                } catch (error) {
                  console.error('[useSupabaseAuth] Error updating user data:', error);
                  if (mounted) {
                    useAuthStore.setState({
                      isLoading: false,
                      error: 'Erro ao carregar dados do usuário',
                    });
                  }
                }
              }, 0);
            }
          }
        );

        // THEN check for existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) {
          subscription.unsubscribe();
          return;
        }

        if (sessionError) {
          console.error('[useSupabaseAuth] Session check error:', sessionError);
          useAuthStore.setState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
          });
        } else {
          setSession(session);
          if (!session) {
            useAuthStore.setState({
              isAuthenticated: false,
              user: null,
              isLoading: false,
              error: null,
            });
          }
          // Session handling will be done by onAuthStateChange
        }

        // Cleanup function
        return () => {
          console.log('[useSupabaseAuth] Cleaning up auth subscription');
          subscription.unsubscribe();
        };

      } catch (error) {
        console.error('[useSupabaseAuth] Initialization error:', error);
        if (mounted) {
          useAuthStore.setState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: 'Erro na inicialização da autenticação',
          });
        }
      }
    };

    const cleanup = initializeAuth();

    // Return cleanup function
    return () => {
      mounted = false;
      cleanup?.then((cleanupFn) => cleanupFn?.());
    };
  }, []); // Empty dependency array for one-time initialization

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    session,
  };
};

export default useSupabaseAuth;
/**
 * Real Supabase Authentication Hook
 * 
 * This hook provides real authentication state management using Supabase
 */

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

export const useSupabaseAuth = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (initialSession) {
          setSession(initialSession);
          // Sync session with auth store if not already authenticated
          if (!isAuthenticated && initialSession.user) {
            await syncUserWithStore(initialSession.user);
          }
        } else {
          // No session found, ensure store is cleared
          if (isAuthenticated) {
            useAuthStore.getState().logout();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, !!currentSession);
        setSession(currentSession);

        if (currentSession?.user) {
          // User signed in
          await syncUserWithStore(currentSession.user);
        } else {
          // User signed out
          if (isAuthenticated) {
            useAuthStore.getState().logout();
          }
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isAuthenticated]);

  // Helper function to sync Supabase user with our auth store
  const syncUserWithStore = async (supabaseUser: User) => {
    try {
      // Get user profile from our users table
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      // Safely map kyc_status
      const kycStatus = userProfile?.kyc_status;
      const validKycStatus: 'pending' | 'approved' | 'rejected' = 
        kycStatus === 'approved' || kycStatus === 'rejected' ? kycStatus : 'pending';

      // Create user data with proper type mapping
      const userData = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        full_name: userProfile?.full_name || supabaseUser.user_metadata?.full_name || 'Usuário',
        name: userProfile?.full_name || supabaseUser.user_metadata?.full_name || 'Usuário',
        phone: userProfile?.phone || supabaseUser.phone,
        role: userProfile?.role || supabaseUser.user_metadata?.role || 'user',
        email_verified: userProfile?.email_verified ?? !!supabaseUser.email_confirmed_at,
        phone_verified: userProfile?.phone_verified ?? !!supabaseUser.phone_confirmed_at,
        avatar_url: userProfile?.avatar_url || supabaseUser.user_metadata?.avatar_url,
        created_at: userProfile?.created_at || supabaseUser.created_at,
        updated_at: userProfile?.updated_at || supabaseUser.updated_at,
        is_vip: userProfile?.is_vip || false,
        vip_expiry_date: userProfile?.vip_expiry_date,
        kyc_status: validKycStatus,
        trust_score: userProfile?.trust_score || 0,
      };

      // Update auth store with properly typed user data
      useAuthStore.setState({
        isAuthenticated: true,
        user: userData,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error syncing user with store:', error);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || initializing,
    session,
    error: useAuthStore.getState().error,
  };
};

export default useSupabaseAuth;
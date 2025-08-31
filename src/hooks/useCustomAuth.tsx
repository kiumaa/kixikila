import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Custom hook to handle authentication with custom session support
 * This manages both Supabase auth and our custom session system
 */
export const useCustomAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const getSession = async () => {
      try {
        // First check Supabase session
        const { data: { session: supabaseSession } } = await supabase.auth.getSession();
        
        if (supabaseSession && isMounted) {
          setSession(supabaseSession);
          setUser(supabaseSession.user);
          setLoading(false);
          return;
        }

        // Check custom session
        const customUser = localStorage.getItem('kixikila_user');
        const customSession = localStorage.getItem('kixikila_session');
        
        if (customUser && customSession && isMounted) {
          const userData = JSON.parse(customUser);
          const sessionData = JSON.parse(customSession);
          
          // Check if session is still valid
          const now = Math.floor(Date.now() / 1000);
          if (sessionData.expires_at > now) {
            setUser(userData);
            setSession(sessionData);
          } else {
            // Session expired, clear it
            localStorage.removeItem('kixikila_user');
            localStorage.removeItem('kixikila_session');
            setUser(null);
            setSession(null);
          }
        } else if (isMounted) {
          setUser(null);
          setSession(null);
        }
      } catch (error) {
        console.error('Session check error:', error);
        if (isMounted) {
          setUser(null);
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Get initial session
    getSession();

    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        console.log('Auth state change:', event, session?.user?.id);
        
        if (session) {
          setSession(session);
          setUser(session.user);
        } else {
          // Only clear if no custom session exists
          const customSession = localStorage.getItem('kixikila_session');
          if (!customSession) {
            setSession(null);
            setUser(null);
          }
        }
        setLoading(false);
      }
    );

    // Listen for custom session changes (storage events)
    const handleStorageChange = (e: StorageEvent) => {
      if (!isMounted) return;
      
      if (e.key === 'kixikila_session' || e.key === 'kixikila_user') {
        if (e.newValue) {
          // Session was set, reload
          getSession();
        } else {
          // Session was cleared
          setUser(null);
          setSession(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const logout = async () => {
    try {
      // Clear Supabase session
      await supabase.auth.signOut();
      
      // Clear custom session
      localStorage.removeItem('kixikila_user');
      localStorage.removeItem('kixikila_session');
      
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getAuthHeaders = () => {
    if (session?.access_token) {
      // Supabase session
      return {
        'Authorization': `Bearer ${session.access_token}`
      };
    } else if (user?.id) {
      // Custom session - use user ID header
      return {
        'x-kixikila-user-id': user.id
      };
    }
    return {};
  };

  return {
    user,
    session,
    loading,
    logout,
    getAuthHeaders,
    isAuthenticated: !loading && (!!user || !!session),
  };
};
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  email: string;
  full_name: string;
  name?: string; // Alias for compatibility
  phone?: string;
  role?: string;
  is_vip?: boolean;
  vip_expiry_date?: string;
  kyc_status?: string;
  trust_score?: number;
  email_verified?: boolean;
  phone_verified?: boolean;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  first_login?: boolean;
  wallet_balance?: number;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Native Supabase Phone Auth Actions
  sendPhoneOtp: (phone: string) => Promise<{ success: boolean; message: string }>;
  verifyPhoneOtp: (phone: string, otp: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getProfile: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => void;
  isAdmin: () => boolean;
  
  // Legacy compatibility methods
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  verifyPin: (pin: string) => Promise<{ success: boolean; message: string }>;
  
  // Flow helpers
  needsOnboarding: () => boolean;
  needsKyc: () => boolean;
  getNextRoute: () => string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,

      sendPhoneOtp: async (phone: string) => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase.auth.signInWithOtp({
            phone: phone,
            options: {
              data: {
                full_name: 'Utilizador' // Default name, can be updated later
              }
            }
          });

          if (error) {
            set({ error: error.message, isLoading: false });
            return { success: false, message: error.message };
          }

          set({ isLoading: false });
          return { success: true, message: 'Código SMS enviado com sucesso!' };
        } catch (error: any) {
          const errorMessage = error.message || 'Erro ao enviar SMS';
          set({ error: errorMessage, isLoading: false });
          return { success: false, message: errorMessage };
        }
      },

      verifyPhoneOtp: async (phone: string, otp: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            phone: phone,
            token: otp,
            type: 'sms'
          });

          if (error) {
            set({ error: error.message, isLoading: false });
            return { success: false, message: error.message };
          }

          if (data.user) {
            // Get user profile from our custom table
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();

            const userData: User = {
              id: data.user.id,
              email: data.user.email || '',
              full_name: profile?.full_name || 'Utilizador',
              name: profile?.full_name || 'Utilizador',
              phone: data.user.phone,
              role: profile?.role || 'user',
              phone_verified: true,
              avatar_url: profile?.avatar_url,
              created_at: data.user.created_at,
              updated_at: data.user.updated_at,
              first_login: profile?.first_login ?? true,
              wallet_balance: profile?.wallet_balance || 0,
              kyc_status: profile?.kyc_status || 'pending',
              is_vip: profile?.is_vip || false,
              trust_score: profile?.trust_score || 50
            };

            set({
              isAuthenticated: true,
              user: userData,
              isLoading: false,
              error: null
            });

            // Intelligent routing
            setTimeout(() => {
              const nextRoute = get().getNextRoute();
              window.location.href = nextRoute;
            }, 100);

            return { success: true, message: 'Login realizado com sucesso!' };
          }

          set({ error: 'Erro na autenticação', isLoading: false });
          return { success: false, message: 'Erro na autenticação' };
        } catch (error: any) {
          const errorMessage = error.message || 'Erro na verificação do código';
          set({ error: errorMessage, isLoading: false });
          return { success: false, message: errorMessage };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await supabase.auth.signOut();
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null
          });
        }
      },

      refreshToken: async () => {
        try {
          const { data, error } = await supabase.auth.refreshSession();
          
          if (error || !data.user) {
            set({
              isAuthenticated: false,
              user: null,
              error: null
            });
            return;
          }

          // Get updated profile
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const userData: User = {
            id: data.user.id,
            email: data.user.email || '',
            full_name: profile?.full_name || 'Utilizador',
            name: profile?.full_name || 'Utilizador',
            phone: data.user.phone,
            role: profile?.role || 'user',
            phone_verified: true,
            avatar_url: profile?.avatar_url,
            created_at: data.user.created_at,
            updated_at: data.user.updated_at,
            first_login: profile?.first_login ?? false,
            wallet_balance: profile?.wallet_balance || 0,
            kyc_status: profile?.kyc_status || 'pending',
            is_vip: profile?.is_vip || false,
            trust_score: profile?.trust_score || 50
          };

          set({
            isAuthenticated: true,
            user: userData,
            error: null
          });
        } catch (error: any) {
          set({
            isAuthenticated: false,
            user: null,
            error: null
          });
        }
      },

      getProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            set({ isLoading: false });
            return;
          }

          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          const userData: User = {
            id: user.id,
            email: user.email || '',
            full_name: profile?.full_name || 'Utilizador',
            name: profile?.full_name || 'Utilizador',
            phone: user.phone,
            role: profile?.role || 'user',
            phone_verified: true,
            avatar_url: profile?.avatar_url,
            created_at: user.created_at,
            updated_at: user.updated_at,
            first_login: profile?.first_login ?? false,
            wallet_balance: profile?.wallet_balance || 0,
            kyc_status: profile?.kyc_status || 'pending',
            is_vip: profile?.is_vip || false,
            trust_score: profile?.trust_score || 50
          };

          set({
            user: userData,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Erro ao buscar perfil'
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      initializeAuth: async () => {
        // Listen to auth state changes
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            // Get user profile
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            const userData: User = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: profile?.full_name || 'Utilizador',
              name: profile?.full_name || 'Utilizador',
              phone: session.user.phone,
              role: profile?.role || 'user',
              phone_verified: true,
              avatar_url: profile?.avatar_url,
              created_at: session.user.created_at,
              updated_at: session.user.updated_at,
              first_login: profile?.first_login ?? false,
              wallet_balance: profile?.wallet_balance || 0,
              kyc_status: profile?.kyc_status || 'pending',
              is_vip: profile?.is_vip || false,
              trust_score: profile?.trust_score || 50
            };

            set({
              isAuthenticated: true,
              user: userData,
              isLoading: false,
              error: null
            });
          } else if (event === 'SIGNED_OUT') {
            set({
              isAuthenticated: false,
              user: null,
              isLoading: false,
              error: null
            });
          }
        });

        // Check initial session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: profile?.full_name || 'Utilizador',
            name: profile?.full_name || 'Utilizador',
            phone: session.user.phone,
            role: profile?.role || 'user',
            phone_verified: true,
            avatar_url: profile?.avatar_url,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at,
            first_login: profile?.first_login ?? false,
            wallet_balance: profile?.wallet_balance || 0,
            kyc_status: profile?.kyc_status || 'pending',
            is_vip: profile?.is_vip || false,
            trust_score: profile?.trust_score || 50
          };

          set({
            isAuthenticated: true,
            user: userData,
            isLoading: false,
            error: null
          });
        }
      },

      isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin';
      },

      needsOnboarding: () => {
        const { user } = get();
        return user?.first_login === true;
      },

      needsKyc: () => {
        const { user } = get();
        return user?.kyc_status === 'pending';
      },

      getNextRoute: () => {
        const { user, needsOnboarding, needsKyc, isAdmin } = get();
        
        if (!user) return '/entrar';
        
        if (isAdmin()) {
          return '/admin/dashboard';
        }
        
        if (needsOnboarding()) {
          return '/onboarding';
        }
        
        if (needsKyc()) {
          return '/kyc';
        }
        
        return '/app/dashboard';
      },

      // Legacy compatibility methods
      login: async (email: string, password: string) => {
        // Redirect to phone auth
        return { success: false, message: 'Use autenticação por telemóvel' };
      },

      verifyPin: async (pin: string) => {
        // PIN auth disabled, redirect to phone auth
        return { success: false, message: 'Use autenticação por telemóvel' };
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user
      })
    }
  )
);

// Initialize auth on app load - handled by AuthInitializer component
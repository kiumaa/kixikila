import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import supabaseAuthService from '../services/supabaseAuthService';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  email: string;
  full_name: string;
  name?: string; // Optional alias for full_name for compatibility
  phone?: string;
  role?: string;
  is_vip?: boolean;
  vip_expiry_date?: string;
  kyc_status?: 'pending' | 'approved' | 'rejected';
  trust_score?: number;
  email_verified?: boolean;
  phone_verified?: boolean;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  first_login?: boolean; // For onboarding flow
  wallet_balance?: number; // Wallet balance
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message: string }>;
  loginWithPhone: (phone: string) => Promise<{ success: boolean; message: string }>;
  verifyPin: (pin: string) => Promise<{ success: boolean; message: string }>;
  sendPhoneOtp: (phone: string) => Promise<{ success: boolean; message: string }>;
  verifyPhoneOtp: (phone: string, otp: string) => Promise<{ success: boolean; message: string }>;
  register: (userData: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    date_of_birth?: string;
    address?: string;
    city?: string;
    country?: string;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  verifyOtp: (email: string, otp: string, type: 'email_verification' | 'phone_verification') => Promise<{ success: boolean; message: string }>;
  resendOtp: (email: string, type: 'email_verification' | 'phone_verification') => Promise<{ success: boolean; message: string }>;
  refreshToken: () => Promise<void>;
  getProfile: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => void;
  isAdmin: () => boolean;
  
  // Enhanced flow helpers
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

  // PIN and device management
  verifyPin: async (pin: string) => {
    set({ isLoading: true, error: null });
    try {
      const deviceId = localStorage.getItem('kixikila_device_id') || crypto.randomUUID();
      const customUserId = localStorage.getItem('kixikila_user_id');
      
      if (!customUserId) {
        throw new Error('Utilizador não está autenticado');
      }

      const { data, error } = await supabase.functions.invoke('pin-management', {
        body: {
          action: 'verify',
          pin,
          deviceId
        },
        headers: {
          'x-kixikila-user-id': customUserId
        }
      });

      if (error) throw error;

      if (data.success) {
        // Get user data from our secure session
        const sessionToken = localStorage.getItem('kixikila_session_token');
        if (sessionToken) {
          try {
            const decoded = atob(sessionToken);
            const sessionData = JSON.parse(decoded);
            const user = { ...sessionData.session.user, name: sessionData.session.user.full_name };
          
          set({
            isAuthenticated: true,
            user,
            isLoading: false,
            error: null,
          });

          setTimeout(() => {
            if (user.role === 'admin') {
              window.location.href = '/admin/dashboard';
            } else {
              window.location.href = '/app/dashboard';
            }
          }, 100);

            return { success: true, message: 'PIN verificado com sucesso!' };
          } catch (error) {
            console.error('Session decode error:', error);
          }
        }
      }

      set({ error: data.error || 'PIN incorreto', isLoading: false });
      return { success: false, message: data.error || 'PIN incorreto' };
      
    } catch (error: any) {
      const errorMessage = error.message || 'Erro na verificação do PIN';
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  loginWithPhone: async (phone: string) => {
    // Start login process by checking if device is trusted
    try {
      const deviceId = localStorage.getItem('kixikila_device_id');
      if (!deviceId) {
        // New device, send OTP
        return await get().sendPhoneOtp(phone);
      }

      // TODO: Check if device is trusted and user has PIN
      // For now, send OTP as fallback
      return await get().sendPhoneOtp(phone);
    } catch (error: any) {
      return { success: false, message: error.message || 'Erro no login' };
    }
  },

  login: async (email: string, password: string, rememberMe = false) => {
    set({ isLoading: true, error: null });
    try {
      const response = await supabaseAuthService.login({ email, password });
      
      if (response.success && response.data) {
        const user = { ...response.data.user, name: response.data.user.full_name };
        set({
          isAuthenticated: true,
          user,
          isLoading: false,
          error: null,
        });

        // Store session data securely for PIN authentication
        try {
          const sessionData = {
            session: response.data.session,
            timestamp: Date.now(),
            deviceId: crypto.randomUUID()
          };
          
          // Use basic obfuscation for session data
          const encoded = btoa(JSON.stringify(sessionData));
          localStorage.setItem('kixikila_session_token', encoded);
          localStorage.setItem('kixikila_user_ref', btoa(user.id));
        } catch (error) {
          console.error('Failed to store session securely:', error);
        }

        // Redirect based on user role
        setTimeout(() => {
          if (user.role === 'admin') {
            window.location.href = '/admin/dashboard';
          } else {
            window.location.href = '/app/dashboard';
          }
        }, 100);

        return { success: true, message: response.message };
      } else {
        set({ error: response.message, isLoading: false });
        return { success: false, message: response.message };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro no login';
      set({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: errorMessage,
      });
      return { success: false, message: errorMessage };
    }
  },

      sendPhoneOtp: async (phone: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await supabaseAuthService.sendPhoneOtp({ phone });
          
          if (response.success) {
            set({
              isLoading: false,
              error: null,
            });
            return { success: true, message: response.message };
          } else {
            set({ error: response.message, isLoading: false });
            return { success: false, message: response.message };
          }
        } catch (error: any) {
          const errorMessage = error.message || 'Erro ao enviar OTP';
          set({
            isLoading: false,
            error: errorMessage,
          });
          return { success: false, message: errorMessage };
        }
      },

      verifyPhoneOtp: async (phone: string, otp: string) => {
        set({ isLoading: true, error: null });
        console.log('AuthStore: Starting verifyPhoneOtp for:', phone);
        
        try {
          const response = await supabaseAuthService.verifyPhoneOtp({ phone, token: otp });
          console.log('AuthStore: Verification response:', response);
          
          // Critical: Only proceed if response is truly successful
          if (response.success === true && response.data && response.data.user) {
            const user = { ...response.data.user, name: response.data.user.full_name };
            console.log('AuthStore: Login successful for user:', user.id);
            
            set({
              isAuthenticated: true,
              user,
              isLoading: false,
              error: null,
            });

            // Store session data securely for PIN authentication
            try {
              const sessionData = {
                session: response.data.session,
                timestamp: Date.now(),
                deviceId: crypto.randomUUID()
              };
              
              const encoded = btoa(JSON.stringify(sessionData));
              localStorage.setItem('kixikila_session_token', encoded);
              localStorage.setItem('kixikila_user_ref', btoa(user.id));
            } catch (error) {
              console.error('Failed to store session securely:', error);
            }

            // For registration (new users), redirect to PIN setup first
            const isNewUser = response.message?.includes('criada');
            
            setTimeout(() => {
              if (user.role === 'admin') {
                window.location.href = '/admin/dashboard';
              } else if (isNewUser) {
                // New users go to PIN setup first
                window.location.href = `/entrar?type=pin_setup&phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(user.full_name)}`;
              } else {
                // Existing users go straight to dashboard
                window.location.href = '/app/dashboard';
              }
            }, 100);

            return { success: true, message: response.message };
          } else {
            // Handle all failure cases consistently
            console.error('AuthStore: Verification failed:', response.message);
            const errorMsg = response.message || 'Código OTP inválido ou expirado. Tente novamente.';
            
            set({ 
              error: errorMsg, 
              isLoading: false,
              isAuthenticated: false,
              user: null 
            });
            
            return { success: false, message: errorMsg };
          }
        } catch (error: any) {
          const errorMessage = error.message || 'Erro na verificação do OTP. Tente novamente.';
          console.error('AuthStore: Critical verification error:', errorMessage, error);
          
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: errorMessage,
          });
          
          return { success: false, message: errorMessage };
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await supabaseAuthService.register(userData);
          
          if (response.success) {
            // Don't set as authenticated yet, user needs to verify email/phone
            set({
              isLoading: false,
              error: null,
            });
            return { success: true, message: response.message };
          } else {
            set({ error: response.message, isLoading: false });
            return { success: false, message: response.message };
          }
        } catch (error: any) {
          const errorMessage = error.message || 'Erro no registro';
          set({
            isLoading: false,
            error: errorMessage,
          });
          return { success: false, message: errorMessage };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await supabaseAuthService.logout();
          
          // Clear all local session data securely
          localStorage.removeItem('kixikila_session_token');
          localStorage.removeItem('kixikila_user_ref');
          localStorage.removeItem('kixikila_device_id');
          localStorage.removeItem('kixikila_device_key');
          localStorage.removeItem('kixikila_device_auth_preference');
          
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          // Even if logout fails on server, clear local state securely  
          localStorage.removeItem('kixikila_session_token');
          localStorage.removeItem('kixikila_user_ref');
          localStorage.removeItem('kixikila_device_id');
          localStorage.removeItem('kixikila_device_key');
          localStorage.removeItem('kixikila_device_auth_preference');
          
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
          });
        }
      },

      verifyOtp: async (email: string, otp: string, type: 'email_verification' | 'phone_verification') => {
        set({ isLoading: true, error: null });
        try {
          const response = await supabaseAuthService.verifyEmailOtp({ email, token: otp, type: 'email' });
          
          if (response.success && response.data) {
            const user = { ...response.data.user, name: response.data.user.full_name };
          set({
            isAuthenticated: true,
            user,
            isLoading: false,
            error: null,
          });

          // Redirect based on user role
          setTimeout(() => {
            if (user.role === 'admin') {
              window.location.href = '/admin/dashboard';
            } else {
              window.location.href = '/app/dashboard';
            }
          }, 100);

          return { success: true, message: response.message };
          } else {
            set({ error: response.message, isLoading: false });
            return { success: false, message: response.message };
          }
        } catch (error: any) {
          const errorMessage = error.message || 'Erro na verificação do OTP';
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: errorMessage,
          });
          return { success: false, message: errorMessage };
        }
      },

      resendOtp: async (email: string, type: 'email_verification' | 'phone_verification') => {
        set({ isLoading: true, error: null });
        try {
          const response = await supabaseAuthService.resendOtp({ email, type: 'signup' });
          
          if (response.success) {
            set({ isLoading: false, error: null });
            return { success: true, message: response.message };
          } else {
            set({ error: response.message, isLoading: false });
            return { success: false, message: response.message };
          }
        } catch (error: any) {
          const errorMessage = error.message || 'Erro ao reenviar OTP';
          set({ error: errorMessage, isLoading: false });
          return { success: false, message: errorMessage };
        }
      },

      refreshToken: async () => {
        try {
          const response = await supabaseAuthService.refreshToken();
          
          if (response.success && response.data.user) {
            const user = { ...response.data.user, name: response.data.user.full_name };
            set({
              isAuthenticated: true,
              user,
              error: null,
            });
          }
        } catch (error: any) {
          // If refresh fails, logout user
          set({
            isAuthenticated: false,
            user: null,
            error: null,
          });
        }
      },

      getProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await supabaseAuthService.getProfile();
          
          if (response.success && response.data) {
            const user = { ...response.data, name: response.data.full_name };
            set({
              user,
              isLoading: false,
              error: null,
            });
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Erro ao buscar perfil',
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
        // Initialization is now handled by useSupabaseAuth hook
        // This is kept for backward compatibility only
      },

      isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin';
      },

      // Enhanced flow helpers
      needsOnboarding: () => {
        const { user } = get();
        return user?.first_login === true;
      },

      needsKyc: () => {
        const { user } = get();
        return user?.kyc_status === 'pending';
      },

      getNextRoute: () => {
        const { user, needsOnboarding, needsKyc } = get();
        
        if (!user) return '/entrar';
        
        // Check if user needs onboarding first
        if (needsOnboarding()) {
          return '/onboarding';
        }
        
        // Then check if user needs KYC
        if (needsKyc()) {
          return '/kyc';
        }
        
        // If user is admin, go to admin panel
        if (user.role === 'admin') {
          return '/admin/dashboard';
        }
        
        // Otherwise go to main app
        return '/app/dashboard';
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);
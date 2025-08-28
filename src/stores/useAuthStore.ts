import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import supabaseAuthService from '../services/supabaseAuthService';

interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  isVip: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  avatarUrl?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, otp: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    dateOfBirth?: string;
    address?: string;
    city?: string;
    country?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  verifyOtp: (email: string, otp: string, type: 'email_verification' | 'phone_verification') => Promise<void>;
  resendOtp: (email: string, type: 'email_verification' | 'phone_verification') => Promise<void>;
  refreshToken: () => Promise<void>;
  getProfile: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string, rememberMe = false) => {
    set({ isLoading: true, error: null });
    try {
      const response = await supabaseAuthService.login({ email, password });
      
      if (response.success && response.data) {
        const { user, session } = response.data;
        set({
          isAuthenticated: true,
          user,
          isLoading: false,
          error: null,
        });
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
        try {
          const response = await supabaseAuthService.verifyPhoneOtp({ phone, token: otp });
          
          if (response.success && response.data) {
            const { user, session } = response.data;
            set({
              isAuthenticated: true,
              user,
              isLoading: false,
              error: null,
            });
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
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          // Even if logout fails on server, clear local state
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
            const { user, session } = response.data;
            set({
              isAuthenticated: true,
              user,
              isLoading: false,
              error: null,
            });
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
            set({
              isAuthenticated: true,
              user: response.data.user,
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
            set({
              user: response.data,
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
        set({ isLoading: true });
        try {
          const isAuth = await supabaseAuthService.isAuthenticated();
          const userData = await supabaseAuthService.getCurrentUser();
          
          if (isAuth && userData) {
            set({
              isAuthenticated: true,
              user: userData,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              isAuthenticated: false,
              user: null,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
          });
        }
      },
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
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/authService';

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
          const response = await authService.login({ email, password, rememberMe });
          
          if (response.success) {
            set({
              isAuthenticated: true,
              user: response.data.user,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error: any) {
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: error.message || 'Erro no login',
          });
          throw error;
        }
      },

      sendPhoneOtp: async (phone: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.sendPhoneOtp({ phone });
          
          if (response.success) {
            set({
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.message || 'Erro ao enviar OTP');
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Erro ao enviar OTP',
          });
          throw error;
        }
      },

      verifyPhoneOtp: async (phone: string, otp: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.verifyPhoneOtp({ phone, otp });
          
          if (response.success) {
            set({
              isAuthenticated: true,
              user: response.data.user,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.message || 'OTP inválido');
          }
        } catch (error: any) {
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: error.message || 'Erro na verificação do OTP',
          });
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(userData);
          
          if (response.success) {
            // Don't set as authenticated yet, user needs to verify email/phone
            set({
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.message || 'Registration failed');
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Erro no registro',
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
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
          const response = await authService.verifyOtp({ email, otp, type });
          
          if (response.success) {
            // If verification includes user data and tokens, update state
            if (response.data && response.data.user) {
              set({
                isAuthenticated: true,
                user: response.data.user,
                isLoading: false,
                error: null,
              });
            } else {
              set({
                isLoading: false,
                error: null,
              });
            }
          } else {
            throw new Error(response.message || 'OTP verification failed');
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Erro na verificação OTP',
          });
          throw error;
        }
      },

      resendOtp: async (email: string, type: 'email_verification' | 'phone_verification') => {
        set({ isLoading: true, error: null });
        try {
          await authService.resendOtp(email, type);
          set({
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Erro ao reenviar OTP',
          });
          throw error;
        }
      },

      refreshToken: async () => {
        try {
          const response = await authService.refreshToken();
          
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
          const response = await authService.getProfile();
          
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

      initializeAuth: () => {
        const isAuth = authService.isAuthenticated();
        const userData = authService.getCurrentUser();
        
        if (isAuth && userData) {
          set({
            isAuthenticated: true,
            user: userData,
          });
          
          // Try to refresh token to ensure it's still valid
          get().refreshToken();
        } else {
          set({
            isAuthenticated: false,
            user: null,
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
/**
 * Supabase Authentication Service for KIXIKILA
 * 
 * This service provides authentication functionality using Supabase Auth
 * with OTP verification for phone numbers and email addresses.
 */

import { supabase } from '@/integrations/supabase/client';
import type { AuthResponse, User } from '@supabase/supabase-js';

// Types for our authentication service
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface PhoneLoginRequest {
  phone: string;
}

export interface VerifyOtpRequest {
  email?: string;
  phone?: string;
  token: string;
  type: 'email' | 'sms';
}

export interface VerifyPhoneOtpRequest {
  phone: string;
  token: string;
}

export interface AuthServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface UserData {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

class SupabaseAuthService {
  /**
   * Register a new user - DISABLED (use phone verification instead)
   */
  async register(userData: RegisterRequest): Promise<AuthServiceResponse<{ user: UserData; session: any }>> {
    return {
      success: false,
      message: 'Registo por email desativado. Use o número de telemóvel para criar conta.',
    };
  }

  /**
   * Login with email and password - DISABLED (use phone verification instead)
   */
  async login(credentials: LoginRequest): Promise<AuthServiceResponse<{ user: UserData; session: any }>> {
    return {
      success: false,
      message: 'Login por email desativado. Use o número de telemóvel para entrar.',
    };
  }

  /**
   * Send OTP to phone number using Enhanced Twilio Integration
   */
  async sendPhoneOtp(phoneData: PhoneLoginRequest): Promise<AuthServiceResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('send-otp-sms', {
        body: {
          phone: phoneData.phone,
          type: 'phone_verification'
        }
      });

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      if (!data?.success) {
        return {
          success: false,
          message: data?.error || 'Erro ao enviar OTP',
        };
      }

      return {
        success: true,
        message: 'Código enviado via SMS',
        data,
      };
    } catch (error: any) {
      console.error('Send phone OTP error:', error);
      return {
        success: false,
        message: error.message || 'Erro ao enviar OTP',
      };
    }
  }

  /**
   * Verify phone OTP using custom system only (no Supabase auth)
   */
  async verifyPhoneOtp(otpData: VerifyPhoneOtpRequest): Promise<AuthServiceResponse<{ user: UserData; session: any }>> {
    try {
      console.log('SupabaseAuthService: Verifying OTP for phone:', otpData.phone);
      
      // Step 1: Verify OTP via Edge Function (this handles everything)
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: {
          phone: otpData.phone,
          token: otpData.token,
          type: 'phone_verification'
        }
      });

      console.log('Edge function response:', { data, error });

      // Check for HTTP errors first (500, timeout, etc.)
      if (error) {
        console.error('Edge function HTTP error:', error);
        
        // Handle different types of HTTP errors
        if (error.message?.includes('FunctionsHttpError')) {
          return {
            success: false,
            message: 'Erro interno no servidor. Tente novamente em alguns instantes.',
          };
        }
        
        return {
          success: false,
          message: 'Erro na verificação. Tente novamente.',
        };
      }

      // Check for successful response from edge function
      if (!data?.success) {
        console.error('Edge function application error:', data);
        return {
          success: false,
          message: data?.error || 'Código OTP inválido ou expirado',
        };
      }

      // Step 2: Extract user data from verified response
      const userData = data.data?.user;
      if (!userData) {
        return {
          success: false,
          message: 'Erro nos dados do utilizador',
        };
      }

      // Step 3: Create custom local session (NO Supabase auth)
      console.log('Creating custom local session for user:', userData.id);
      
      const customSession = {
        access_token: `custom_session_${userData.id}_${Date.now()}`,
        refresh_token: `custom_refresh_${userData.id}_${Date.now()}`,
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: {
          id: userData.id,
          email: userData.email,
          phone: userData.phone,
          user_metadata: {
            full_name: userData.full_name,
            phone: userData.phone,
            kixikila_user_id: userData.id,
            is_phone_verified: true
          }
        }
      };

      // Store custom session for PIN management
      localStorage.setItem('kixikila_custom_session', JSON.stringify(customSession));
      localStorage.setItem('kixikila_user_id', userData.id);

      return {
        success: true,
        message: data.data?.isNewUser ? 'Conta criada com sucesso!' : 'Login realizado com sucesso!',
        data: {
          user: this.formatCustomUserData(userData),
          session: customSession,
        },
      };
    } catch (error: any) {
      console.error('Critical error in verifyPhoneOtp:', error);
      
      // Enhanced error handling for different scenarios
      let errorMessage = 'Erro na verificação OTP';
      
      if (error.message?.includes('fetch')) {
        errorMessage = 'Erro de conectividade. Verifique sua conexão e tente novamente.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Timeout na verificação. Tente novamente em alguns instantes.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

   /**
    * Format custom user data to our UserData interface (phone-only system)
    */
   private formatCustomUserData(userData: any): UserData {
     return {
       id: userData.id,
       email: userData.email || '', // Email pode ser vazio agora
       full_name: userData.full_name || 'Utilizador',
       phone: userData.phone,
       role: userData.role || 'user',
       email_verified: userData.email_verified || false,
       phone_verified: userData.phone_verified || true,
       avatar_url: userData.avatar_url,
       created_at: userData.created_at,
       updated_at: userData.updated_at,
     };
   }

  /**
   * Send OTP to email - DISABLED (use phone verification instead)
   */
  async sendEmailOtp(email: string): Promise<AuthServiceResponse> {
    return {
      success: false,
      message: 'Verificação por email desativada. Use o número de telemóvel.',
    };
  }

  /**
   * Verify OTP (generic function for email verification)
   */
  async verifyOtp(email: string, token: string): Promise<AuthServiceResponse<{ user: UserData; session: any }>> {
    return this.verifyEmailOtp({ email, token, type: 'email' });
  }

  /**
   * Verify email OTP - DISABLED (use phone verification instead)
   */
  async verifyEmailOtp(otpData: VerifyOtpRequest): Promise<AuthServiceResponse<{ user: UserData; session: any }>> {
    return {
      success: false,
      message: 'Verificação por email desativada. Use o número de telemóvel.',
    };
  }

  /**
   * Logout user
   */
  async logout(): Promise<AuthServiceResponse> {
    try {
      // Clear custom session data
      localStorage.removeItem('kixikila_custom_session');
      localStorage.removeItem('kixikila_user_id');
      
      // Also try to sign out from Supabase auth if there's a session
      const { error } = await supabase.auth.signOut();

      // Don't fail if Supabase signout fails - custom system doesn't depend on it
      if (error) {
        console.warn('Supabase signout error (non-critical):', error);
      }

      return {
        success: true,
        message: 'Logout realizado com sucesso',
      };
    } catch (error: any) {
      console.error('Logout error:', error);
      
      // Even if there's an error, clear local storage
      localStorage.removeItem('kixikila_custom_session');
      localStorage.removeItem('kixikila_user_id');
      
      return {
        success: true,
        message: 'Logout realizado com sucesso',
      };
    }
  }

  /**
   * Get current user session
   */
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Get session error:', error);
        return null;
      }

      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<UserData | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }

      const userProfile = await this.getUserProfile(user.id);
      return userProfile || this.formatUserData(user);
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return !!session;
  }

  /**
   * Get user profile from custom users table
   */
  private async getUserProfile(userId?: string): Promise<UserData | null> {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        role: data.role,
        email_verified: data.email_verified,
        phone_verified: data.phone_verified,
        avatar_url: data.avatar_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  /**
   * Format Supabase user data to our UserData interface
   */
  private formatUserData(user: User | null): UserData | null {
    if (!user) return null;

    return {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || 'Usuário',
      phone: user.phone,
      role: user.user_metadata?.role || 'user',
      email_verified: user.email_confirmed_at ? true : false,
      phone_verified: user.phone_confirmed_at ? true : false,
      avatar_url: user.user_metadata?.avatar_url,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  /**
   * Resend OTP - DISABLED (use phone verification instead)
   */
  async resendOtp(data: { email: string; type: string }): Promise<AuthServiceResponse> {
    return {
      success: false,
      message: 'Reenvio por email desativado. Use o número de telemóvel.',
    };
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Refresh token
   */
  async refreshToken(): Promise<AuthServiceResponse<{ user: UserData; session: any }>> {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      const userProfile = await this.getUserProfile(data.user?.id);

      return {
        success: true,
        message: 'Token atualizado com sucesso',
        data: {
          user: userProfile || this.formatUserData(data.user),
          session: data.session,
        },
      };
    } catch (error: any) {
      console.error('Refresh token error:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar token',
      };
    }
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<AuthServiceResponse<UserData>> {
    try {
      const user = await this.getCurrentUser();

      if (!user) {
        return {
          success: false,
          message: 'Usuário não encontrado',
        };
      }

      return {
        success: true,
        message: 'Perfil obtido com sucesso',
        data: user,
      };
    } catch (error: any) {
      console.error('Get profile error:', error);
      return {
        success: false,
        message: error.message || 'Erro ao buscar perfil',
      };
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();
export default supabaseAuthService;
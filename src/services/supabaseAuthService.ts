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
   * Register a new user with email and password
   */
  async register(userData: RegisterRequest): Promise<AuthServiceResponse<{ user: UserData; session: any }>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            phone: userData.phone,
          },
        },
      });

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      // Create user profile in our custom users table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: userData.email,
            full_name: userData.full_name,
            phone: userData.phone,
            email_verified: false,
            phone_verified: false,
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }
      }

      return {
        success: true,
        message: 'Usuário registrado com sucesso. Verifique seu email.',
        data: {
          user: this.formatUserData(data.user),
          session: data.session,
        },
      };
    } catch (error: any) {
      console.error('Register error:', error);
      return {
        success: false,
        message: error.message || 'Erro no registro',
      };
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<AuthServiceResponse<{ user: UserData; session: any }>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      // Get user profile from our custom users table
      const userProfile = await this.getUserProfile(data.user?.id);

      return {
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: userProfile || this.formatUserData(data.user),
          session: data.session,
        },
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Erro no login',
      };
    }
  }

  /**
   * Send OTP to phone number using our Edge Function
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
        message: 'OTP enviado para o seu telefone',
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
   * Verify phone OTP using our Edge Function
   */
  async verifyPhoneOtp(otpData: VerifyPhoneOtpRequest): Promise<AuthServiceResponse<{ user: UserData; session: any }>> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: {
          phone: otpData.phone,
          token: otpData.token,
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
          message: data?.error || 'Código OTP inválido ou expirado',
        };
      }

      // Extract data from Edge Function response
      const { user: userData, session: sessionData, tempCredentials } = data.data || {};

      if (userData && tempCredentials) {
        // Use temporary credentials to create a proper Supabase Auth session
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: tempCredentials.email,
          password: tempCredentials.password,
        });

        if (authError || !authData.session) {
          console.error('Failed to create session with temp credentials:', authError);
          return {
            success: false,
            message: 'Erro ao criar sessão de login',
          };
        }

        return {
          success: true,
          message: 'Login realizado com sucesso',
          data: {
            user: userData,
            session: authData.session,
          },
        };
      }

      // Fallback for existing users without temp credentials
      if (userData && sessionData) {
        return {
          success: true,
          message: 'Login realizado com sucesso',
          data: {
            user: userData,
            session: sessionData,
          },
        };
      }

      return {
        success: false,
        message: 'Erro na autenticação - dados incompletos',
      };
    } catch (error: any) {
      console.error('Verify phone OTP error:', error);
      return {
        success: false,
        message: error.message || 'Erro na verificação do OTP',
      };
    }
  }

  /**
   * Send OTP to email
   */
  async sendEmailOtp(email: string): Promise<AuthServiceResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
      });

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: true,
        message: 'OTP enviado para o seu email',
        data,
      };
    } catch (error: any) {
      console.error('Send email OTP error:', error);
      return {
        success: false,
        message: error.message || 'Erro ao enviar OTP',
      };
    }
  }

  /**
   * Verify OTP (generic function for email verification)
   */
  async verifyOtp(email: string, token: string): Promise<AuthServiceResponse<{ user: UserData; session: any }>> {
    return this.verifyEmailOtp({ email, token, type: 'email' });
  }

  /**
   * Verify email OTP
   */
  async verifyEmailOtp(otpData: VerifyOtpRequest): Promise<AuthServiceResponse<{ user: UserData; session: any }>> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: otpData.email!,
        token: otpData.token,
        type: 'email',
      });

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      // Get user profile
      const userProfile = await this.getUserProfile(data.user?.id);

      return {
        success: true,
        message: 'Email verificado com sucesso',
        data: {
          user: userProfile || this.formatUserData(data.user),
          session: data.session,
        },
      };
    } catch (error: any) {
      console.error('Verify email OTP error:', error);
      return {
        success: false,
        message: error.message || 'Erro na verificação do OTP',
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<AuthServiceResponse> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: true,
        message: 'Logout realizado com sucesso',
      };
    } catch (error: any) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: error.message || 'Erro no logout',
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
   * Resend OTP
   */
  async resendOtp(data: { email: string; type: string }): Promise<AuthServiceResponse> {
    try {
      const { data: result, error } = await supabase.auth.resend({
        type: 'signup',
        email: data.email,
      });

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: true,
        message: 'OTP reenviado com sucesso',
        data: result,
      };
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      return {
        success: false,
        message: error.message || 'Erro ao reenviar OTP',
      };
    }
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
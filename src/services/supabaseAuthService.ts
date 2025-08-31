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
   * Verify phone OTP using simplified Edge Function approach
   */
  async verifyPhoneOtp(otpData: VerifyPhoneOtpRequest): Promise<AuthServiceResponse<{ user: UserData; session: any }>> {
    try {
      console.log('SupabaseAuthService: Verifying OTP for phone:', otpData.phone);
      
      // Step 1: Verify OTP via Edge Function with enhanced error handling
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

      // Step 3: Create custom session without Supabase auth
      // Since Supabase auth signups are disabled, we'll create a local session
      // using the user data from our custom users table
      
      console.log('Creating custom session for user:', userData.id);
      
      // Create a custom session object that mimics Supabase session structure
      const customSession = this.createCustomSession(userData);
      
      // Store session data locally for persistence
      localStorage.setItem('kixikila_session', JSON.stringify(customSession));
      localStorage.setItem('kixikila_user', JSON.stringify(userData));
      
      console.log('Custom session created successfully');

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
   * Create a custom session that mimics Supabase session structure
   * This allows our app to function without actual Supabase auth
   */
  private createCustomSession(userData: any): any {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    return {
      access_token: `custom_token_${userData.id}_${now.getTime()}`,
      refresh_token: `custom_refresh_${userData.id}_${now.getTime()}`,
      expires_in: 86400, // 24 hours
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      token_type: 'bearer',
      user: {
        id: userData.id,
        email: userData.email || `${userData.phone}@kixikila.temp`,
        phone: userData.phone,
        user_metadata: {
          kixikila_user_id: userData.id,
          phone: userData.phone,
          full_name: userData.full_name,
          is_phone_verified: true,
          custom_auth: true
        }
      }
    };
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
   * Checks both Supabase auth and custom session
   */
  async getCurrentUser(): Promise<UserData | null> {
    try {
      // First try Supabase auth
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!error && user) {
        const userProfile = await this.getUserProfile(user.id);
        return userProfile || this.formatUserData(user);
      }

      // If no Supabase user, check custom session
      const customUser = localStorage.getItem('kixikila_user');
      const customSession = localStorage.getItem('kixikila_session');
      
      if (customUser && customSession) {
        const userData = JSON.parse(customUser);
        const sessionData = JSON.parse(customSession);
        
        // Check if session is still valid
        const now = Math.floor(Date.now() / 1000);
        if (sessionData.expires_at > now) {
          return this.formatCustomUserData(userData);
        } else {
          // Session expired, clear it
          localStorage.removeItem('kixikila_user');
          localStorage.removeItem('kixikila_session');
        }
      }

      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   * Checks both Supabase auth and custom session
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // First check Supabase auth
      const session = await this.getCurrentSession();
      if (session) return true;

      // Check custom session
      const customSession = localStorage.getItem('kixikila_session');
      if (customSession) {
        const sessionData = JSON.parse(customSession);
        const now = Math.floor(Date.now() / 1000);
        return sessionData.expires_at > now;
      }

      return false;
    } catch {
      return false;
    }
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
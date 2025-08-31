import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface PhoneLoginRequest {
  phone: string;
}

interface VerifyPhoneOtpRequest {
  phone: string;
  otp: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  country?: string;
}

interface AuthResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      fullName: string;
      phone: string;
      role: string;
      isVip: boolean;
      emailVerified: boolean;
      phoneVerified: boolean;
      avatarUrl?: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: string;
    };
  };
  message: string;
}

interface VerifyOtpRequest {
  email: string;
  otp: string;
  type: 'email_verification' | 'phone_verification';
}

interface PhoneOtpResponse {
  success: boolean;
  message: string;
  data?: {
    sessionId: string;
  };
}

class AuthService {
  private getHeaders(includeAuth = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.login}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro no login');
      }

      // Store tokens
      if (data.success && data.data.tokens) {
        localStorage.setItem('auth_token', data.data.tokens.accessToken);
        localStorage.setItem('refresh_token', data.data.tokens.refreshToken);
        localStorage.setItem('user_data', JSON.stringify(data.data.user));
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.register}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro no registro');
      }

      return data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  async verifyOtp(otpData: VerifyOtpRequest): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.verify}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(otpData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro na verificação OTP');
      }

      return data;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  }

  async resendOtp(email: string, type: 'email_verification' | 'phone_verification'): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.resendOtp}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao reenviar OTP');
      }

      return data;
    } catch (error) {
      console.error('Resend OTP error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.logout}`, {
        method: 'POST',
        headers: this.getHeaders(true),
      });

      // Clear local storage regardless of response
      this.clearAuthData();

      if (!response.ok) {
        console.warn('Logout request failed, but local data cleared');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local data even if request fails
      this.clearAuthData();
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      // With Supabase, token refresh is handled automatically
      // Just return current session if available
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No refresh token available');
      }

      return {
        success: true,
        message: 'Token refreshed',
        data: {
          user: JSON.parse(localStorage.getItem('user_data') || '{}'),
          tokens: {
            accessToken: token,
            refreshToken: token,
            expiresIn: '3600'
          }
        }
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuthData();
      throw error;
    }
  }

  async getProfile(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.me}`, {
        method: 'GET',
        headers: this.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar perfil');
      }

      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  async sendPhoneOtp(phoneData: PhoneLoginRequest): Promise<PhoneOtpResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.login}/phone-otp`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(phoneData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao enviar OTP');
      }

      return data;
    } catch (error) {
      console.error('Send phone OTP error:', error);
      throw error;
    }
  }

  async verifyPhoneOtp(otpData: VerifyPhoneOtpRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.login}/verify-phone-otp`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(otpData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro na verificação do OTP');
      }

      // Store tokens if login is successful
      if (data.success && data.data.tokens) {
        localStorage.setItem('auth_token', data.data.tokens.accessToken);
        localStorage.setItem('refresh_token', data.data.tokens.refreshToken);
        localStorage.setItem('user_data', JSON.stringify(data.data.user));
      }

      return data;
    } catch (error) {
      console.error('Verify phone OTP error:', error);
      throw error;
    }
  }

  clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token;
  }

  getCurrentUser(): any {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}

export const authService = new AuthService();
export default authService;
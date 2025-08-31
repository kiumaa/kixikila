import { API_BASE_URL, getAuthHeaders } from '@/config/api';

// Standard API Response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Configuration interfaces
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromAddress: string;
}

interface StripeConfig {
  secretKey: string;
  publicKey: string;
  webhookSecret: string;
}

interface BulkSMSConfig {
  tokenId: string;
  tokenSecret: string;
}

// API Service class
class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      return data as ApiResponse<T>;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create API instances
export const api = new ApiService(API_BASE_URL);

// Admin API with specific methods
export const adminApi = {
  // Email configuration
  getEmailConfig: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/email-config`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  updateEmailConfig: async (config: EmailConfig) => {
    const response = await fetch(`${API_BASE_URL}/admin/email-config`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });
    return response.json();
  },

  testEmailConfig: async (testEmail: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/email-config/test`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ testEmail })
    });
    return response.json();
  },

  // Stripe configuration
  getStripeConfig: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/stripe-config`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  updateStripeConfig: async (config: StripeConfig) => {
    const response = await fetch(`${API_BASE_URL}/admin/stripe-config`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });
    return response.json();
  },

  // BulkSMS configuration
  getBulkSMSConfig: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/bulksms-config`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  updateBulkSMSConfig: async (config: BulkSMSConfig) => {
    const response = await fetch(`${API_BASE_URL}/admin/bulksms-config`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });
    return response.json();
  },

  testBulkSMSConfig: async (testNumber: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/bulksms-config/test`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ testPhone: testNumber })
    });
    return response.json();
  },

  // Users management
  getUsers: async (page = 1, limit = 10) => {
    const response = await fetch(`${API_BASE_URL}/admin/users?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};

// Export default instance
export default api;

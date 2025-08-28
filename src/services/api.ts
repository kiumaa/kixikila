import { API_BASE_URL } from '@/config/api';

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

export const adminApi = {
  // Email configuration
  getEmailConfig: async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/email-config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  },

  updateEmailConfig: async (config: EmailConfig) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/email-config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(config)
    });
    return response.json();
  },

  testEmailConfig: async (testEmail: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ testEmail })
    });
    return response.json();
  },

  // Stripe configuration
  getStripeConfig: async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/stripe-config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  },

  updateStripeConfig: async (config: StripeConfig) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/stripe-config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(config)
    });
    return response.json();
  },

  // BulkSMS configuration
  getBulkSMSConfig: async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/bulksms-config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  },

  updateBulkSMSConfig: async (config: BulkSMSConfig) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/bulksms-config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(config)
    });
    return response.json();
  },

  testBulkSMSConfig: async (testNumber: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/test-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ testNumber })
    });
    return response.json();
  }
};
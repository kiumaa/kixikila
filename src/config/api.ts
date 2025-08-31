/**
 * API Configuration for KIXIKILA Frontend - Supabase Edge Functions
 * 
 * This file contains the API endpoints configuration for Supabase Edge Functions.
 * All backend functionality is handled through Supabase Edge Functions.
 */

// Supabase Edge Functions URLs
const SUPABASE_URL = 'https://hkesrohuaurcyonpktyt.supabase.co';

// Get current API base URL - Using Supabase Edge Functions
export const API_BASE_URL = `${SUPABASE_URL}/functions/v1`;

// API Endpoints - Using Supabase Edge Functions
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    register: '/send-otp-sms',
    login: '/send-otp-sms', 
    logout: '/auth/logout', // Placeholder - handled client-side
    me: '/auth/me', // Placeholder - handled client-side  
    verify: '/verify-otp',
    resendOtp: '/send-otp-sms'
  },

  // Payments & Subscriptions (Stripe)
  payments: {
    createCheckout: '/create-checkout',
    customerPortal: '/customer-portal',
    createPayment: '/create-payment'
  },

  // Groups & Drawing
  groups: {
    draw: '/draw-group-winner',
    invite: '/send-group-invitation'
  },

  // Messaging & Notifications
  messaging: {
    sendSMS: '/send-message',
    sendEmail: '/send-email',
    bulkMessages: '/send-bulk-messages'
  },

  // Admin & Monitoring
  admin: {
    monitoring: '/admin-monitoring',
    health: '/health-check',
    productionHealth: '/production-health',
    serviceHealth: '/service-health-monitor',
    auditLogs: '/get-audit-logs',
    createAdmin: '/create-admin-user',
    securityAlerts: '/security-alerts',
    systemConfig: '/manage-system-config',
    cleanup: '/cleanup-expired-data'
  },

  // KYC Management
  kyc: {
    manage: '/kyc-management'
  },

  // PIN Management  
  pin: {
    manage: '/pin-management'
  },

  // Subscription Management
  subscription: {
    check: '/check-subscription'
  }
};

// Request configuration
export const API_CONFIG = {
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Helper function to build full URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to get auth headers for Supabase
export const getAuthHeaders = (): Record<string, string> => {
  // Get Supabase session from localStorage
  const supabaseSession = localStorage.getItem('sb-hkesrohuaurcyonpktyt-auth-token');
  if (supabaseSession) {
    try {
      const sessionData = JSON.parse(supabaseSession);
      const token = sessionData?.access_token;
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (e) {
      console.error('Error parsing Supabase session:', e);
      return {};
    }
  }
  return {};
};

// Export environment info
export const ENV_INFO = {
  apiUrl: API_BASE_URL,
  mode: import.meta.env.MODE,
  isProduction: import.meta.env.MODE === 'production'
};

console.log('🔗 API Configuration (Supabase Edge Functions):', {
  environment: import.meta.env.MODE,
  apiUrl: API_BASE_URL,
  supabaseUrl: 'https://hkesrohuaurcyonpktyt.supabase.co'
});
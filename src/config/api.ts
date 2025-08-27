/**
 * API Configuration for KIXIKILA Frontend
 * 
 * This file contains the API endpoints and configuration for the frontend application.
 * It automatically detects the environment and uses the appropriate API URL.
 */

// Environment detection
const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';

// API Base URLs
const API_URLS = {
  development: 'http://localhost:3001/api/v1',
  production: import.meta.env.VITE_API_URL || 'https://kixikila-backend.railway.app/api/v1',
  staging: import.meta.env.VITE_API_URL || 'https://kixikila-backend-staging.railway.app/api/v1'
};

// Get current API base URL
export const API_BASE_URL = isDevelopment 
  ? API_URLS.development 
  : API_URLS.production;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    verify: '/auth/verify',
    resendOtp: '/auth/resend-otp',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password'
  },

  // Users
  users: {
    profile: '/users/profile',
    updateProfile: '/users/profile',
    deleteAccount: '/users/account',
    preferences: '/users/preferences',
    avatar: '/users/avatar'
  },

  // Financial Groups
  groups: {
    list: '/groups',
    create: '/groups',
    details: (id: string) => `/groups/${id}`,
    update: (id: string) => `/groups/${id}`,
    delete: (id: string) => `/groups/${id}`,
    join: (id: string) => `/groups/${id}/join`,
    leave: (id: string) => `/groups/${id}/leave`,
    members: (id: string) => `/groups/${id}/members`,
    transactions: (id: string) => `/groups/${id}/transactions`,
    draw: (id: string) => `/groups/${id}/draw`,
    invite: (id: string) => `/groups/${id}/invite`
  },

  // Transactions
  transactions: {
    list: '/transactions',
    create: '/transactions',
    details: (id: string) => `/transactions/${id}`,
    update: (id: string) => `/transactions/${id}`,
    delete: (id: string) => `/transactions/${id}`,
    history: '/transactions/history'
  },

  // Notifications
  notifications: {
    list: '/notifications',
    unreadCount: '/notifications/unread-count',
    markAsRead: (id: string) => `/notifications/${id}/read`,
    markAllAsRead: '/notifications/mark-all-read',
    preferences: '/notifications/preferences'
  },

  // Payments (Stripe)
  payments: {
    createIntent: '/stripe/create-payment-intent',
    confirmPayment: '/stripe/confirm-payment',
    subscriptions: '/stripe/subscriptions',
    createSubscription: '/stripe/create-subscription',
    cancelSubscription: (id: string) => `/stripe/subscriptions/${id}/cancel`,
    invoices: '/stripe/invoices'
  },

  // Admin
  admin: {
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    groups: '/admin/groups',
    transactions: '/admin/transactions',
    analytics: '/admin/analytics',
    settings: '/admin/settings'
  },

  // Health Check
  health: '/health'
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

// Helper function to get auth headers
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Export environment info
export const ENV_INFO = {
  isDevelopment,
  isProduction,
  apiUrl: API_BASE_URL,
  mode: import.meta.env.MODE
};

console.log('🔗 API Configuration:', {
  environment: import.meta.env.MODE,
  apiUrl: API_BASE_URL,
  isDevelopment,
  isProduction
});
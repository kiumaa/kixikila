import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';

// General rate limiting middleware
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/api/v1/health',
  onLimitReached: (req: Request) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip} on path: ${req.path}`);
  }
});

// Authentication rate limiting (stricter)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 authentication attempts per 15 minutes
  message: {
    error: 'Too many authentication attempts from this IP. Please try again later.',
    retryAfter: 15 * 60,
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  onLimitReached: (req: Request) => {
    logger.warn(`Authentication rate limit exceeded for IP: ${req.ip} on path: ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
  }
});

// OTP rate limiting (very strict)
export const otpRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Only 3 OTP requests per 5 minutes
  message: {
    error: 'Too many OTP requests from this IP. Please wait before requesting another code.',
    retryAfter: 5 * 60,
    code: 'OTP_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req: Request) => {
    logger.warn(`OTP rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
  }
});

// Password reset rate limiting
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 password reset attempts per hour
  message: {
    error: 'Too many password reset attempts from this IP. Please try again later.',
    retryAfter: 60 * 60,
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req: Request) => {
    logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      email: req.body?.email
    });
  }
});

// API rate limiting (higher limits for general API usage)
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Higher limit for API endpoints
  message: {
    error: 'API rate limit exceeded. Please try again later.',
    retryAfter: 15 * 60,
    code: 'API_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req: Request) => {
    logger.warn(`API rate limit exceeded for IP: ${req.ip} on path: ${req.path}`);
  }
});

// Admin operations rate limiting (moderate limits)
export const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Moderate limit for admin operations
  message: {
    error: 'Admin operations rate limit exceeded. Please try again later.',
    retryAfter: 15 * 60,
    code: 'ADMIN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req: Request) => {
    logger.warn(`Admin rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      userId: (req as any).user?.id
    });
  }
});

// Financial operations rate limiting (very strict)
export const financialRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Only 20 financial operations per hour
  message: {
    error: 'Financial operations rate limit exceeded. Please try again later.',
    retryAfter: 60 * 60,
    code: 'FINANCIAL_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req: Request) => {
    logger.warn(`Financial rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      userId: (req as any).user?.id,
      amount: req.body?.amount
    });
  }
});

// Export all rate limiters
export const rateLimiters = {
  general: generalRateLimit,
  auth: authRateLimit,
  otp: otpRateLimit,
  passwordReset: passwordResetRateLimit,
  api: apiRateLimit,
  admin: adminRateLimit,
  financial: financialRateLimit
};
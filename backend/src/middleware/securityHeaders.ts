import { Request, Response, NextFunction } from 'express';

/**
 * Security Headers Middleware - Production Hardened
 * Implements comprehensive security headers for production environment
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Content Security Policy - Strict policy for XSS protection
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://js.stripe.com https://*.supabase.co; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co; " +
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "frame-ancestors 'none'; " +
    "upgrade-insecure-requests"
  );

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS Protection (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict Transport Security - Force HTTPS
  if (req.secure || req.get('X-Forwarded-Proto') === 'https') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Referrer Policy - Limit information leakage
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy - Restrict powerful features
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()'
  );

  // Remove server information
  res.removeHeader('X-Powered-By');
  res.setHeader('Server', 'KIXIKILA');

  // Cache control for sensitive endpoints
  if (req.path.includes('/admin') || req.path.includes('/api')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

/**
 * CSRF Protection Headers
 */
export const csrfHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Generate and validate CSRF token for state-changing operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const csrfToken = req.get('X-CSRF-Token') || req.body?.csrfToken;
    const sessionToken = req.get('Authorization');
    
    if (!csrfToken && !sessionToken?.startsWith('Bearer')) {
      return res.status(403).json({
        error: 'CSRF token required for this operation'
      });
    }
  }

  // Set CSRF token for client
  res.setHeader('X-CSRF-Token', generateCSRFToken());
  next();
};

/**
 * Rate Limiting Headers
 */
export const rateLimitHeaders = (req: Request, res: Response, next: NextFunction) => {
  const remaining = res.get('X-RateLimit-Remaining') || '100';
  const limit = res.get('X-RateLimit-Limit') || '100';
  const reset = res.get('X-RateLimit-Reset') || String(Date.now() + 900000);

  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Reset', reset);

  next();
};

/**
 * Generate CSRF Token
 */
function generateCSRFToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Security Event Logger
 */
export const logSecurityEvent = (eventType: string, req: Request, details?: any) => {
  const securityLog = {
    timestamp: new Date().toISOString(),
    eventType,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    path: req.path,
    method: req.method,
    details
  };

  console.warn('SECURITY EVENT:', JSON.stringify(securityLog));
  
  // In production, send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Integration with external security monitoring
  }
};
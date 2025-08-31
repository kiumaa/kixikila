/**
 * Security Configuration - Production Hardened
 * All secrets must be provided via environment variables
 */

export interface SecurityConfig {
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  encryption: {
    algorithm: string;
    keyLength: number;
  };
  password: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
  };
  session: {
    maxAge: number;
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };
  headers: {
    contentSecurityPolicy: string;
    xFrameOptions: string;
    xContentTypeOptions: string;
    referrerPolicy: string;
  };
}

const getRequiredEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
};

const validatePassword = (password: string): void => {
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    throw new Error('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    throw new Error('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    throw new Error('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    throw new Error('Password must contain at least one special character');
  }
};

// Validate critical environment variables on load
const validateSecurityConfig = () => {
  const jwtSecret = getRequiredEnvVar('JWT_SECRET');
  const sessionSecret = getRequiredEnvVar('SESSION_SECRET');
  
  // Validate JWT secret strength
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  
  // Validate session secret strength
  if (sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long');
  }
  
  // Check for default/weak values
  const weakSecrets = [
    'your-super-secret-jwt-key-here',
    'your-session-secret-here',
    'your-super-secure-jwt-secret-key-here',
    'your-super-secure-session-secret-key-here',
    'admin123',
    'password123',
    'secret',
    'test',
    'demo',
    'example',
    '123456',
    'qwerty',
    'admin',
    'password',
    'secret123',
    'test123',
    'development',
    'localhost',
    'sample'
  ];
  
  weakSecrets.forEach(weak => {
    if (jwtSecret.toLowerCase().includes(weak.toLowerCase())) {
      throw new Error('JWT_SECRET contains weak/default values. Use a strong, unique secret.');
    }
    if (sessionSecret.toLowerCase().includes(weak.toLowerCase())) {
      throw new Error('SESSION_SECRET contains weak/default values. Use a strong, unique secret.');
    }
  });
};

// Validate configuration in production
if (process.env.NODE_ENV === 'production') {
  validateSecurityConfig();
}

export const securityConfig: SecurityConfig = {
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    skipSuccessfulRequests: false
  },
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32
  },
  password: {
    minLength: 12, // Increased from 8 to 12
    requireUppercase: true,
    requireLowercase: true, 
    requireNumbers: true,
    requireSymbols: true // Changed from false to true
  },
  session: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000'), // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  },
  headers: {
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin'
  }
};

export { validatePassword };
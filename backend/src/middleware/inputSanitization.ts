import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../middleware/errorHandler';

/**
 * Enhanced Input Sanitization Middleware
 * Protects against XSS, SQL Injection, and other injection attacks
 */

// Dangerous patterns that should be blocked or sanitized
const DANGEROUS_PATTERNS = {
  xss: [
    /<script[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[\s\S]*?<\/iframe>/gi,
    /<object[\s\S]*?<\/object>/gi,
    /<embed[\s\S]*?>/gi,
    /<link[\s\S]*?>/gi,
    /<meta[\s\S]*?>/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /data:text\/html/gi,
    /vbscript:/gi
  ],
  
  sqlInjection: [
    /('|(\\');|;|\||`|<|>|\*|%|=|\+|-|\/|\?|#|\$|&|\^)/gi,
    /(union|select|insert|update|delete|drop|create|alter|exec|execute)\s/gi,
    /\/\*[\s\S]*?\*\//gi,
    /--[\s\S]*$/gm,
    /xp_|sp_/gi
  ],
  
  pathTraversal: [
    /\.\.\//gi,
    /\.\.\\\\gi,
    /\/etc\/passwd/gi,
    /\/windows\/system32/gi,
    /proc\/self\/environ/gi
  ],
  
  codeInjection: [
    /eval\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi,
    /Function\s*\(/gi,
    /require\s*\(/gi,
    /import\s*\(/gi,
    /process\./gi,
    /child_process/gi
  ]
};

/**
 * Sanitize a string value
 */
function sanitizeString(value: string): string {
  if (typeof value !== 'string') return value;

  let sanitized = value;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Normalize unicode
  sanitized = sanitized.normalize('NFKC');

  // Limit length to prevent DoS
  if (sanitized.length > 10000) {
    throw new ValidationError('Input too long');
  }

  // Remove dangerous XSS patterns
  DANGEROUS_PATTERNS.xss.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove dangerous SQL injection patterns
  DANGEROUS_PATTERNS.sqlInjection.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove path traversal attempts
  DANGEROUS_PATTERNS.pathTraversal.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove code injection attempts
  DANGEROUS_PATTERNS.codeInjection.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  return sanitized;
}

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length > 1000) {
      throw new ValidationError('Array too large');
    }
    return obj.map(sanitizeObject);
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length > 100) {
      throw new ValidationError('Object has too many properties');
    }

    const sanitizedObj: any = {};
    for (const key of keys) {
      const sanitizedKey = sanitizeString(key);
      sanitizedObj[sanitizedKey] = sanitizeObject(obj[key]);
    }
    return sanitizedObj;
  }

  return obj;
}

/**
 * Detect potentially malicious content
 */
function detectMaliciousContent(value: string): string[] {
  const threats: string[] = [];

  // Check for XSS
  if (DANGEROUS_PATTERNS.xss.some(pattern => pattern.test(value))) {
    threats.push('XSS');
  }

  // Check for SQL injection
  if (DANGEROUS_PATTERNS.sqlInjection.some(pattern => pattern.test(value))) {
    threats.push('SQL_INJECTION');
  }

  // Check for path traversal
  if (DANGEROUS_PATTERNS.pathTraversal.some(pattern => pattern.test(value))) {
    threats.push('PATH_TRAVERSAL');
  }

  // Check for code injection
  if (DANGEROUS_PATTERNS.codeInjection.some(pattern => pattern.test(value))) {
    threats.push('CODE_INJECTION');
  }

  return threats;
}

/**
 * Main input sanitization middleware
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize route parameters
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    // Log suspicious activity
    const allInputs = JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params
    });

    const threats = detectMaliciousContent(allInputs);
    if (threats.length > 0) {
      console.warn('SECURITY: Malicious content detected', {
        threats,
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent')
      });

      // In production, you might want to block the request entirely
      if (process.env.NODE_ENV === 'production' && threats.includes('CODE_INJECTION')) {
        return res.status(400).json({
          error: 'Invalid input detected'
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Strict sanitization for sensitive endpoints
 */
export const strictSanitization = (req: Request, res: Response, next: NextFunction) => {
  const allInputs = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params
  });

  const threats = detectMaliciousContent(allInputs);
  if (threats.length > 0) {
    console.error('SECURITY: Blocking malicious request', {
      threats,
      ip: req.ip,
      path: req.path
    });

    return res.status(400).json({
      error: 'Request blocked due to security policy'
    });
  }

  next();
};
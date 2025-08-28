import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from './errorHandler';
import { logger } from '../utils/logger';

interface ValidationSchema {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  headers?: Joi.ObjectSchema;
}

/**
 * Middleware to validate request data using Joi schemas
 */
export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
      });
      
      if (error) {
        const bodyErrors = error.details.map(detail => `Body: ${detail.message}`);
        errors.push(...bodyErrors);
      }
    }

    // Validate request parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
      });
      
      if (error) {
        const paramErrors = error.details.map(detail => `Params: ${detail.message}`);
        errors.push(...paramErrors);
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
      });
      
      if (error) {
        const queryErrors = error.details.map(detail => `Query: ${detail.message}`);
        errors.push(...queryErrors);
      }
    }

    // Validate headers
    if (schema.headers) {
      const { error } = schema.headers.validate(req.headers, {
        abortEarly: false,
        allowUnknown: true, // Allow unknown headers
        stripUnknown: false,
      });
      
      if (error) {
        const headerErrors = error.details.map(detail => `Headers: ${detail.message}`);
        errors.push(...headerErrors);
      }
    }

    // If there are validation errors, throw ValidationError
    if (errors.length > 0) {
      logger.warn('Validation failed', {
        url: req.originalUrl,
        method: req.method,
        errors,
        body: req.body,
        params: req.params,
        query: req.query,
      });
      
      throw new ValidationError(errors.join('; '));
    }

    next();
  };
};

/**
 * Common validation patterns
 */
export const commonValidations = {
  // UUID validation
  uuid: Joi.string().uuid({ version: 'uuidv4' }).required(),
  optionalUuid: Joi.string().uuid({ version: 'uuidv4' }).optional(),
  
  // Email validation
  email: Joi.string().email().lowercase().trim().required(),
  optionalEmail: Joi.string().email().lowercase().trim().optional(),
  
  // Password validation
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'password')
    .required()
    .messages({
      'string.pattern.name': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
    }),
  
  // Phone validation (international format)
  phone: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be in international format (e.g., +1234567890)',
    }),
  optionalPhone: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Phone number must be in international format (e.g., +1234567890)',
    }),
  
  // Name validation
  name: Joi.string().trim().min(2).max(100).required(),
  optionalName: Joi.string().trim().min(2).max(100).optional(),
  
  // Amount validation (for financial transactions) - Enhanced security
  amount: Joi.number()
    .positive()
    .precision(2)
    .min(0.01) // Minimum 1 cent
    .max(999999.99) // Maximum $999,999.99 to prevent overflow
    .required()
    .messages({
      'number.min': 'Amount must be at least 0.01',
      'number.max': 'Amount cannot exceed 999,999.99',
      'number.positive': 'Amount must be positive'
    }),
  optionalAmount: Joi.number()
    .positive()
    .precision(2)
    .min(0.01)
    .max(999999.99)
    .optional()
    .messages({
      'number.min': 'Amount must be at least 0.01',
      'number.max': 'Amount cannot exceed 999,999.99',
      'number.positive': 'Amount must be positive'
    }),
  
  // Date validation
  date: Joi.date().iso().required(),
  optionalDate: Joi.date().iso().optional(),
  
  // Pagination - Enhanced security limits
  page: Joi.number()
    .integer()
    .min(1)
    .max(10000) // Prevent excessive pagination
    .default(1)
    .messages({
      'number.min': 'Page must be at least 1',
      'number.max': 'Page cannot exceed 10,000'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100) // Strict limit to prevent DoS
    .default(20)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  
  // Search - Enhanced security
  search: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .pattern(/^[a-zA-Z0-9\s\-_.@]+$/) // Only allow safe characters
    .optional()
    .messages({
      'string.min': 'Search term must be at least 1 character',
      'string.max': 'Search term cannot exceed 100 characters',
      'string.pattern.base': 'Search term contains invalid characters'
    }),
  
  // Sort
  sortBy: Joi.string().trim().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  
  // OTP validation
  otp: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    'string.length': 'OTP must be exactly 6 digits',
    'string.pattern.base': 'OTP must contain only numbers',
  }),
  
  // URL validation
  url: Joi.string().uri().optional(),
  
  // Boolean validation
  boolean: Joi.boolean().required(),
  optionalBoolean: Joi.boolean().optional(),
  
  // Enum validation helper
  enum: (values: string[]) => Joi.string().valid(...values).required(),
  optionalEnum: (values: string[]) => Joi.string().valid(...values).optional(),
};

/**
 * Sanitize input data - Enhanced security
 */
export const sanitizeInput = (data: any): any => {
  if (typeof data === 'string') {
    return data
      .trim()
      // Remove potential XSS patterns
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      // Remove SQL injection patterns
      .replace(/('|(\-\-)|(;)|(\|)|(\*)|(%))/g, '')
      // Limit length to prevent buffer overflow
      .substring(0, 10000);
  }
  
  if (Array.isArray(data)) {
    // Limit array size to prevent DoS
    if (data.length > 1000) {
      throw new ValidationError('Array size exceeds maximum allowed limit');
    }
    return data.map(sanitizeInput);
  }
  
  if (data && typeof data === 'object') {
    // Limit object depth and size
    const keys = Object.keys(data);
    if (keys.length > 100) {
      throw new ValidationError('Object has too many properties');
    }
    
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Sanitize key names
      const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 100);
      if (sanitizedKey) {
        sanitized[sanitizedKey] = sanitizeInput(value);
      }
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Additional security validation for sensitive operations
 */
export const validateSensitiveOperation = (req: Request): void => {
  // Check for suspicious patterns in headers
  const userAgent = req.headers['user-agent'] || '';
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /burp/i,
    /scanner/i
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    logger.warn('Suspicious user agent detected', {
      userAgent,
      ip: req.ip,
      url: req.originalUrl
    });
    throw new ValidationError('Request blocked for security reasons');
  }
  
  // Check request size
  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > 10 * 1024 * 1024) { // 10MB limit
    throw new ValidationError('Request payload too large');
  }
};

export default validateRequest;
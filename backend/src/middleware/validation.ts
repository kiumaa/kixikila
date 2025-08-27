import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from './errorHandler.ts';
import { logger } from '../utils/logger.ts';

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
  
  // Amount validation (for financial transactions)
  amount: Joi.number().positive().precision(2).required(),
  optionalAmount: Joi.number().positive().precision(2).optional(),
  
  // Date validation
  date: Joi.date().iso().required(),
  optionalDate: Joi.date().iso().optional(),
  
  // Pagination
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  
  // Search
  search: Joi.string().trim().min(1).max(100).optional(),
  
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
 * Sanitize input data
 */
export const sanitizeInput = (data: any): any => {
  if (typeof data === 'string') {
    return data.trim();
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
};

export default validateRequest;
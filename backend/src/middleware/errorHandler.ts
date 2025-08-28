import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

export class AppError extends Error implements ApiError {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 400, true, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, true, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, true, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, false, 'INTERNAL_SERVER_ERROR');
    this.name = 'InternalServerError';
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode: number;
    timestamp: string;
    path: string;
    method: string;
    stack?: string;
    details?: any;
  };
}

// Main error handler middleware
export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Set default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'UNKNOWN_ERROR';
  let isOperational = err.isOperational ?? false;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    isOperational = true;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data format';
    code = 'CAST_ERROR';
    isOperational = true;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
    isOperational = true;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
    isOperational = true;
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = 'File upload error';
    code = 'FILE_UPLOAD_ERROR';
    isOperational = true;
  }

  // Log error
  const errorLog = {
    message: err.message,
    statusCode,
    code,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    timestamp: new Date().toISOString(),
  };

  if (statusCode >= 500) {
    logger.error('Server Error:', errorLog);
  } else {
    logger.warn('Client Error:', errorLog);
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message,
      code,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    },
  };

  // Include stack trace in development
  if (config.nodeEnv === 'development') {
    errorResponse.error.stack = err.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason: reason?.stack || reason,
  });
  
  // Close server gracefully
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
  });
  
  // Close server gracefully
  process.exit(1);
});
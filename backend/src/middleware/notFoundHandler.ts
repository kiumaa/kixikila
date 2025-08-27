import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from './errorHandler.ts';
import { logger } from '../utils/logger.ts';

/**
 * Middleware to handle 404 Not Found errors
 * This should be placed after all route handlers
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the 404 attempt
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // Create and pass the error to error handler
  const error = new NotFoundError(
    `Route ${req.method} ${req.originalUrl} not found`
  );
  
  next(error);
};

export default notFoundHandler;
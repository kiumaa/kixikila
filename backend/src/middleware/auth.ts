import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AuthenticationError, AuthorizationError } from './errorHandler';
import { supabase } from '../services/supabase';
import { logger } from '../utils/logger.js';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        isVip: boolean;
        groupIds: string[];
        iat?: number;
        exp?: number;
      };
    }
  }
}

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  isVip: boolean;
  groupIds: string[];
  iat?: number;
  exp?: number;
}

// Main authentication middleware
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Access token is required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new AuthenticationError('Access token is required');
    }

    // Verify JWT token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid token');
      } else {
        throw new AuthenticationError('Token verification failed');
      }
    }

    // Verify user exists in database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, is_vip, is_active, email_verified')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      logger.warn('User not found in database', { userId: decoded.id, error });
      throw new AuthenticationError('User not found');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Check if email is verified
    if (!user.email_verified) {
      throw new AuthenticationError('Email not verified');
    }

    // Get user's group memberships
    const { data: groupMemberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const groupIds = groupMemberships?.map(gm => gm.group_id) || [];

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isVip: user.is_vip,
      groupIds,
      iat: decoded.iat,
      exp: decoded.exp,
    };

    logger.debug('User authenticated successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication middleware (doesn't throw if no token)
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }

    // Try to verify token
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      
      // Get user from database
      const { data: user } = await supabase
        .from('users')
        .select('id, email, role, is_vip, is_active, email_verified')
        .eq('id', decoded.id)
        .single();

      if (user && user.is_active && user.email_verified) {
        // Get user's group memberships
        const { data: groupMemberships } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id)
          .eq('status', 'active');

        const groupIds = groupMemberships?.map(gm => gm.group_id) || [];

        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          isVip: user.is_vip,
          groupIds,
          iat: decoded.iat,
          exp: decoded.exp,
        };
      }
    } catch (error) {
      // Silently ignore token errors in optional auth
      logger.debug('Optional auth failed', { error: error.message });
    }

    next();
  } catch (error) {
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
    }

    next();
  };
};

// Admin only middleware
export const requireAdmin = requireRole('admin');

// VIP membership middleware
export const requireVip = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }

  if (!req.user.isVip) {
    throw new AuthorizationError('VIP membership required');
  }

  next();
};

// Group membership middleware
export const requireGroupMembership = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }

  const groupId = req.params.groupId || req.body.groupId;
  
  if (!groupId) {
    throw new AuthorizationError('Group ID is required');
  }

  if (!req.user.groupIds.includes(groupId) && req.user.role !== 'admin') {
    throw new AuthorizationError('Group membership required');
  }

  next();
};

// Generate JWT token
export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

// Generate refresh token
export const generateRefreshToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

// Verify refresh token
export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
};
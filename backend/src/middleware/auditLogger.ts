import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { supabase } from '../services/supabase.js';

// Define audit event types
export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  OTP_VERIFICATION = 'OTP_VERIFICATION',
  
  // Admin actions
  ADMIN_USER_STATUS_CHANGE = 'ADMIN_USER_STATUS_CHANGE',
  ADMIN_USER_ROLE_CHANGE = 'ADMIN_USER_ROLE_CHANGE',
  ADMIN_CONFIG_UPDATE = 'ADMIN_CONFIG_UPDATE',
  ADMIN_EMAIL_CONFIG_UPDATE = 'ADMIN_EMAIL_CONFIG_UPDATE',
  ADMIN_STRIPE_CONFIG_UPDATE = 'ADMIN_STRIPE_CONFIG_UPDATE',
  ADMIN_SMS_CONFIG_UPDATE = 'ADMIN_SMS_CONFIG_UPDATE',
  
  // Financial operations
  PAYMENT_CREATED = 'PAYMENT_CREATED',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  TRANSACTION_CREATED = 'TRANSACTION_CREATED',
  
  // Security events
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Data access
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',
  BULK_DATA_EXPORT = 'BULK_DATA_EXPORT',
  USER_DATA_DELETION = 'USER_DATA_DELETION'
}

// Audit log entry interface
interface AuditLogEntry {
  event_type: AuditEventType;
  user_id?: string;
  ip_address: string;
  user_agent: string;
  resource?: string;
  action?: string;
  details?: Record<string, any>;
  success: boolean;
  error_message?: string;
  timestamp: string;
  session_id?: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Risk assessment function
function assessRiskLevel(eventType: AuditEventType, details?: Record<string, any>): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const criticalEvents = [
    AuditEventType.ADMIN_USER_ROLE_CHANGE,
    AuditEventType.ADMIN_CONFIG_UPDATE,
    AuditEventType.SUSPICIOUS_ACTIVITY,
    AuditEventType.UNAUTHORIZED_ACCESS
  ];
  
  const highEvents = [
    AuditEventType.ADMIN_USER_STATUS_CHANGE,
    AuditEventType.PAYMENT_CREATED,
    AuditEventType.SUBSCRIPTION_CREATED,
    AuditEventType.USER_DATA_DELETION,
    AuditEventType.BULK_DATA_EXPORT
  ];
  
  const mediumEvents = [
    AuditEventType.LOGIN_FAILED,
    AuditEventType.PASSWORD_CHANGE,
    AuditEventType.RATE_LIMIT_EXCEEDED,
    AuditEventType.VALIDATION_ERROR
  ];
  
  if (criticalEvents.includes(eventType)) return 'CRITICAL';
  if (highEvents.includes(eventType)) return 'HIGH';
  if (mediumEvents.includes(eventType)) return 'MEDIUM';
  
  // Check for suspicious patterns in details
  if (details) {
    if (details.multiple_failures || details.unusual_location || details.suspicious_user_agent) {
      return 'HIGH';
    }
  }
  
  return 'LOW';
}

// Main audit logging function
export async function logAuditEvent(
  eventType: AuditEventType,
  req: Request,
  options: {
    userId?: string;
    resource?: string;
    action?: string;
    details?: Record<string, any>;
    success?: boolean;
    errorMessage?: string;
  } = {}
): Promise<void> {
  try {
    const auditEntry: AuditLogEntry = {
      event_type: eventType,
      user_id: options.userId || (req as any).user?.id,
      ip_address: req.ip || req.connection.remoteAddress || 'unknown',
      user_agent: req.get('User-Agent') || 'unknown',
      resource: options.resource,
      action: options.action,
      details: options.details,
      success: options.success ?? true,
      error_message: options.errorMessage,
      timestamp: new Date().toISOString(),
      session_id: req.sessionID,
      risk_level: assessRiskLevel(eventType, options.details)
    };
    
    // Log to application logger
    const logLevel = auditEntry.risk_level === 'CRITICAL' || auditEntry.risk_level === 'HIGH' ? 'warn' : 'info';
    logger[logLevel]('Audit Event', auditEntry);
    
    // Store in database for persistent audit trail
    const { error } = await supabase
      .from('audit_logs')
      .insert([auditEntry]);
    
    if (error) {
      logger.error('Failed to store audit log in database:', error);
    }
    
    // Alert on critical events
    if (auditEntry.risk_level === 'CRITICAL') {
      await alertCriticalEvent(auditEntry);
    }
    
  } catch (error) {
    logger.error('Failed to log audit event:', error);
  }
}

// Alert function for critical events
async function alertCriticalEvent(auditEntry: AuditLogEntry): Promise<void> {
  try {
    // Log critical alert
    logger.error('CRITICAL SECURITY EVENT DETECTED', {
      event: auditEntry.event_type,
      user_id: auditEntry.user_id,
      ip: auditEntry.ip_address,
      details: auditEntry.details
    });
    
    // Here you could integrate with alerting systems like:
    // - Email notifications
    // - Slack/Discord webhooks
    // - SMS alerts
    // - Security monitoring tools
    
  } catch (error) {
    logger.error('Failed to send critical event alert:', error);
  }
}

// Middleware for automatic audit logging
export function auditMiddleware(eventType: AuditEventType, options: {
  resource?: string;
  action?: string;
  extractDetails?: (req: Request, res: Response) => Record<string, any>;
} = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      const success = res.statusCode < 400;
      const details = options.extractDetails ? options.extractDetails(req, res) : undefined;
      
      // Log the audit event
      logAuditEvent(eventType, req, {
        resource: options.resource,
        action: options.action,
        details,
        success,
        errorMessage: success ? undefined : 'Request failed'
      }).catch(error => {
        logger.error('Audit middleware error:', error);
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}

// Specific audit middleware for admin actions
export const auditAdminAction = (action: string) => {
  return auditMiddleware(AuditEventType.ADMIN_CONFIG_UPDATE, {
    resource: 'admin',
    action,
    extractDetails: (req) => ({
      body: req.body,
      params: req.params,
      query: req.query
    })
  });
};

// Specific audit middleware for financial operations
export const auditFinancialOperation = (operation: string) => {
  return auditMiddleware(AuditEventType.PAYMENT_CREATED, {
    resource: 'financial',
    action: operation,
    extractDetails: (req) => ({
      amount: req.body?.amount,
      currency: req.body?.currency,
      payment_method: req.body?.payment_method
    })
  });
};

// Specific audit middleware for authentication events
export const auditAuthEvent = (eventType: AuditEventType) => {
  return auditMiddleware(eventType, {
    resource: 'auth',
    extractDetails: (req) => ({
      email: req.body?.email,
      phone: req.body?.phone,
      login_method: req.body?.login_method
    })
  });
};

// Export the main logging function and types
export { AuditLogEntry };
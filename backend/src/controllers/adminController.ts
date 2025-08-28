import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { emailService } from '../services/emailService';
import { smsService } from '../services/smsService';
import { logAuditEvent, AuditEventType } from '../middleware/auditLogger';

interface EmailCredentials {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromAddress: string;
}

interface StripeCredentials {
  secretKey: string;
  publicKey: string;
  webhookSecret: string;
}

interface BulkSMSCredentials {
  tokenId: string;
  tokenSecret: string;
}

class AdminController {
  /**
   * Get current email configuration
   */
  getEmailConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Admin getting email config', { adminId: req.user?.id });
      
      const config = {
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER || '',
        fromName: process.env.EMAIL_FROM_NAME || 'KIXIKILA',
        fromAddress: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || '',
        // Don't return password for security
        hasPassword: !!(process.env.SMTP_PASS || process.env.EMAIL_PASSWORD)
      };
      
      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      logger.error('Error getting email config:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Update email configuration
   */
  updateEmailConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    
    try {
      const { host, port, secure, user, password, fromName, fromAddress } = req.body as EmailCredentials;
      
      logger.info('Admin updating email config', { adminId: req.user?.id, host, user });
      
      // Update environment variables
      await this.updateEnvVariable('SMTP_HOST', host);
      await this.updateEnvVariable('SMTP_PORT', port.toString());
      await this.updateEnvVariable('SMTP_SECURE', secure.toString());
      await this.updateEnvVariable('SMTP_USER', user);
      if (password) {
        await this.updateEnvVariable('SMTP_PASS', password);
        await this.updateEnvVariable('EMAIL_PASSWORD', password);
      }
      await this.updateEnvVariable('EMAIL_FROM_NAME', fromName);
      await this.updateEnvVariable('EMAIL_FROM_ADDRESS', fromAddress);
      
      // Log admin action
      await logAuditEvent({
        eventType: AuditEventType.ADMIN_CONFIG_UPDATE,
        userId: req.user?.id || 'unknown',
        ipAddress,
        details: {
          configType: 'email',
          changes: {
            host,
            port,
            secure,
            user,
            fromName,
            fromAddress,
            passwordUpdated: !!password
          },
          timestamp: new Date().toISOString()
        }
      });
      
      res.json({
        success: true,
        message: 'Configuração de email atualizada com sucesso'
      });
    } catch (error) {
      logger.error('Error updating email config:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Test email configuration
   */
  testEmailConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { testEmail } = req.body;
      
      logger.info('Admin testing email config', { adminId: req.user?.id, testEmail });
      
      // Send test email
      await emailService.sendEmail({
        to: testEmail,
        subject: 'Teste de Configuração - KIXIKILA',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Teste de Configuração de Email</h2>
            <p>Este é um email de teste para verificar se a configuração de email está funcionando corretamente.</p>
            <p>Se você recebeu este email, a configuração está funcionando perfeitamente!</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">© 2024 KIXIKILA. Todos os direitos reservados.</p>
          </div>
        `,
        text: 'Este é um email de teste para verificar se a configuração de email está funcionando corretamente.'
      });
      
      res.json({
        success: true,
        message: 'Email de teste enviado com sucesso'
      });
    } catch (error) {
      logger.error('Error testing email config:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao enviar email de teste: ' + (error as Error).message
      });
    }
  });

  /**
   * Get Stripe configuration
   */
  getStripeConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Admin getting Stripe config', { adminId: req.user?.id });
      
      const config = {
        hasSecretKey: !!(process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder')),
        hasPublicKey: !!(process.env.STRIPE_PUBLIC_KEY && !process.env.STRIPE_PUBLIC_KEY.includes('placeholder')),
        hasWebhookSecret: !!(process.env.STRIPE_WEBHOOK_SECRET && !process.env.STRIPE_WEBHOOK_SECRET.includes('placeholder')),
        publicKey: process.env.STRIPE_PUBLIC_KEY?.includes('placeholder') ? '' : process.env.STRIPE_PUBLIC_KEY || ''
      };
      
      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      logger.error('Error getting Stripe config:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Update Stripe configuration
   */
  updateStripeConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    
    try {
      const { secretKey, publicKey, webhookSecret } = req.body as StripeCredentials;
      
      logger.info('Admin updating Stripe config', { adminId: req.user?.id });
      
      // Update environment variables
      if (secretKey) {
        await this.updateEnvVariable('STRIPE_SECRET_KEY', secretKey);
      }
      if (publicKey) {
        await this.updateEnvVariable('STRIPE_PUBLIC_KEY', publicKey);
      }
      if (webhookSecret) {
        await this.updateEnvVariable('STRIPE_WEBHOOK_SECRET', webhookSecret);
      }
      
      // Log admin action
      await logAuditEvent({
        eventType: AuditEventType.ADMIN_CONFIG_UPDATE,
        userId: req.user?.id || 'unknown',
        ipAddress,
        details: {
          configType: 'stripe',
          changes: {
            secretKeyUpdated: !!secretKey,
            publicKeyUpdated: !!publicKey,
            webhookSecretUpdated: !!webhookSecret
          },
          timestamp: new Date().toISOString()
        }
      });
      
      res.json({
        success: true,
        message: 'Configuração do Stripe atualizada com sucesso'
      });
    } catch (error) {
      logger.error('Error updating Stripe config:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Get BulkSMS configuration
   */
  getBulkSMSConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Admin getting BulkSMS config', { adminId: req.user?.id });
      
      const config = {
        hasTokenId: !!(process.env.BULKSMS_TOKEN_ID && !process.env.BULKSMS_TOKEN_ID.includes('placeholder')),
        hasTokenSecret: !!(process.env.BULKSMS_TOKEN_SECRET && !process.env.BULKSMS_TOKEN_SECRET.includes('placeholder'))
      };
      
      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      logger.error('Error getting BulkSMS config:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Update BulkSMS configuration
   */
  updateBulkSMSConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    
    try {
      const { tokenId, tokenSecret } = req.body as BulkSMSCredentials;
      
      logger.info('Admin updating BulkSMS config', { adminId: req.user?.id });
      
      // Update environment variables
      await this.updateEnvVariable('BULKSMS_TOKEN_ID', tokenId);
      await this.updateEnvVariable('BULKSMS_TOKEN_SECRET', tokenSecret);
      
      // Log admin action
      await logAuditEvent({
        eventType: AuditEventType.ADMIN_CONFIG_UPDATE,
        userId: req.user?.id || 'unknown',
        ipAddress,
        details: {
          configType: 'bulksms',
          changes: {
            tokenIdUpdated: !!tokenId,
            tokenSecretUpdated: !!tokenSecret
          },
          timestamp: new Date().toISOString()
        }
      });
      
      res.json({
        success: true,
        message: 'Configuração do BulkSMS atualizada com sucesso'
      });
    } catch (error) {
      logger.error('Error updating BulkSMS config:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });
    }
  });

  /**
   * Test SMS configuration
   */
  testSMSConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { testPhone } = req.body;
      
      logger.info('Admin testing SMS config', { adminId: req.user?.id, testPhone });
      
      // Send test SMS
      await smsService.sendSMS(testPhone, 'Teste de configuração SMS - KIXIKILA. Se você recebeu esta mensagem, a configuração está funcionando!');
      
      res.json({
        success: true,
        message: 'SMS de teste enviado com sucesso'
      });
    } catch (error) {
      logger.error('Error testing SMS config:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao enviar SMS de teste: ' + (error as Error).message
      });
    }
  });

  /**
   * Get system configurations
   */
  getSystemConfigurations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Admin getting system configurations', { adminId: req.user?.id });
      
      res.json({
        success: true,
        message: 'Use the manage-system-config edge function for advanced configurations',
        data: {}
      });
    } catch (error) {
      logger.error('Error getting system configurations:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Update system configurations
   */
  updateSystemConfigurations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Admin updating system configurations', { adminId: req.user?.id });
      
      res.json({
        success: true,
        message: 'Use the manage-system-config edge function for advanced configurations',
        data: {}
      });
    } catch (error) {
      logger.error('Error updating system configurations:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Get message templates
   */
  getMessageTemplates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Admin getting message templates', { adminId: req.user?.id });
      
      res.json({
        success: true,
        message: 'Use the manage-system-config edge function for template management',
        data: []
      });
    } catch (error) {
      logger.error('Error getting message templates:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Create message template
   */
  createMessageTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Admin creating message template', { adminId: req.user?.id });
      
      res.json({
        success: true,
        message: 'Use the manage-system-config edge function for template management'
      });
    } catch (error) {
      logger.error('Error creating message template:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Update message template
   */
  updateMessageTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Admin updating message template', { adminId: req.user?.id });
      
      res.json({
        success: true,
        message: 'Use the manage-system-config edge function for template management'
      });
    } catch (error) {
      logger.error('Error updating message template:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Delete message template
   */
  deleteMessageTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Admin deleting message template', { adminId: req.user?.id });
      
      res.json({
        success: true,
        message: 'Use the manage-system-config edge function for template management'
      });
    } catch (error) {
      logger.error('Error deleting message template:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Get advanced SMS configuration
   */
  getAdvancedSMSConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Admin getting advanced SMS config', { adminId: req.user?.id });
      
      res.json({
        success: true,
        message: 'Use the manage-system-config edge function for advanced SMS configuration',
        data: {}
      });
    } catch (error) {
      logger.error('Error getting advanced SMS config:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Update advanced SMS configuration
   */
  updateAdvancedSMSConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Admin updating advanced SMS config', { adminId: req.user?.id });
      
      res.json({
        success: true,
        message: 'Use the manage-system-config edge function for advanced SMS configuration'
      });
    } catch (error) {
      logger.error('Error updating advanced SMS config:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Get security configuration
   */
  getSecurityConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Admin getting security config', { adminId: req.user?.id });
      
      res.json({
        success: true,
        message: 'Use the manage-system-config edge function for security configuration',
        data: {}
      });
    } catch (error) {
      logger.error('Error getting security config:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Update security configuration
   */
  updateSecurityConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Admin updating security config', { adminId: req.user?.id });
      
      res.json({
        success: true,
        message: 'Use the manage-system-config edge function for security configuration'
      });
    } catch (error) {
      logger.error('Error updating security config:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Get notification configuration
   */
  getNotificationConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Admin getting notification config', { adminId: req.user?.id });
      
      res.json({
        success: true,
        message: 'Use the manage-system-config edge function for notification configuration',
        data: {}
      });
    } catch (error) {
      logger.error('Error getting notification config:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Update notification configuration
   */
  updateNotificationConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Admin updating notification config', { adminId: req.user?.id });
      
      res.json({
        success: true,
        message: 'Use the manage-system-config edge function for notification configuration'
      });
    } catch (error) {
      logger.error('Error updating notification config:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Get webhooks
   */
  getWebhooks = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Admin getting webhooks', { adminId: req.user?.id });
      
      res.json({
        success: true,
        message: 'Use the manage-system-config edge function for webhook management',
        data: []
      });
    } catch (error) {
      logger.error('Error getting webhooks:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Create webhook
   */
  createWebhook = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Admin creating webhook', { adminId: req.user?.id });
      
      res.json({
        success: true,
        message: 'Use the manage-system-config edge function for webhook management'
      });
    } catch (error) {
      logger.error('Error creating webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Update webhook
   */
  updateWebhook = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Admin updating webhook', { adminId: req.user?.id });
      
      res.json({
        success: true,
        message: 'Use the manage-system-config edge function for webhook management'
      });
    } catch (error) {
      logger.error('Error updating webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Delete webhook
   */
  deleteWebhook = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Admin deleting webhook', { adminId: req.user?.id });
      
      res.json({
        success: true,
        message: 'Use the manage-system-config edge function for webhook management'
      });
    } catch (error) {
      logger.error('Error deleting webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Get service health
   */
  getServiceHealth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Admin getting service health', { adminId: req.user?.id });
      
      res.json({
        success: true,
        message: 'Use the service-health-monitor edge function for service health monitoring',
        data: []
      });
    } catch (error) {
      logger.error('Error getting service health:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Check services health
   */
  checkServicesHealth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Admin checking services health', { adminId: req.user?.id });
      
      res.json({
        success: true,
        message: 'Use the service-health-monitor edge function for service health monitoring'
      });
    } catch (error) {
      logger.error('Error checking services health:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  /**
   * Helper method to update environment variables
   */
  private async updateEnvVariable(key: string, value: string): Promise<void> {
    try {
      const envPath = path.join(process.cwd(), '.env');
      let envContent = '';
      
      try {
        envContent = await fs.readFile(envPath, 'utf8');
      } catch (error) {
        // File doesn't exist, create new content
        envContent = '';
      }
      
      const lines = envContent.split('\n');
      let found = false;
      
      // Update existing variable or add new one
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith(`${key}=`)) {
          lines[i] = `${key}=${value}`;
          found = true;
          break;
        }
      }
      
      if (!found) {
        lines.push(`${key}=${value}`);
      }
      
      await fs.writeFile(envPath, lines.join('\n'));
      
      // Update process.env for immediate effect
      process.env[key] = value;
      
      logger.info(`Environment variable ${key} updated`);
    } catch (error) {
      logger.error(`Error updating environment variable ${key}:`, error);
      throw error;
    }
  }
}

export const adminController = new AdminController();
export default adminController;
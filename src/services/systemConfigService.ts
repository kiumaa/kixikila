import { supabase } from '@/integrations/supabase/client';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromAddress: string;
  hasPassword?: boolean;
}

export interface StripeConfig {
  secretKey: string;
  publicKey: string;
  webhookSecret: string;
  hasSecretKey?: boolean;
  hasPublicKey?: boolean;
  hasWebhookSecret?: boolean;
}

export interface BulkSMSConfig {
  tokenId: string;
  tokenSecret: string;
  hasTokenId?: boolean;
  hasTokenSecret?: boolean;
}

class SystemConfigService {
  // Email Configuration
  async getEmailConfig(): Promise<{ success: boolean; data?: EmailConfig; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('manage-system-config', {
        body: { action: 'get_system_config', config_type: 'email' }
      });

      if (error) throw error;

      const emailConfig = data?.data?.find((config: any) => config.config_type === 'email');
      
      return {
        success: true,
        data: emailConfig?.config_value || {
          host: '',
          port: 587,
          secure: false,
          user: '',
          password: '',
          fromName: 'KIXIKILA',
          fromAddress: ''
        }
      };
    } catch (error: any) {
      console.error('Error getting email config:', error);
      return { success: false, error: error.message };
    }
  }

  async updateEmailConfig(config: EmailConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('manage-system-config', {
        body: {
          action: 'update_system_config',
          config_key: 'email_configuration',
          config_type: 'email',
          config_value: config,
          description: 'Configuração de envio de email via SMTP'
        }
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error updating email config:', error);
      return { success: false, error: error.message };
    }
  }

  async testEmailConfig(testEmail: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('send-message', {
        body: {
          type: 'email',
          recipient: testEmail,
          templateId: null,
          variables: {
            subject: 'Teste de Configuração KIXIKILA',
            content: 'Este é um email de teste para verificar se a configuração está funcionando corretamente.'
          }
        }
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error testing email config:', error);
      return { success: false, error: error.message };
    }
  }

  // Stripe Configuration
  async getStripeConfig(): Promise<{ success: boolean; data?: StripeConfig; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('manage-system-config', {
        body: { action: 'get_system_config', config_type: 'stripe' }
      });

      if (error) throw error;

      const stripeConfig = data?.data?.find((config: any) => config.config_type === 'stripe');
      
      return {
        success: true,
        data: stripeConfig?.config_value || {
          secretKey: '',
          publicKey: '',
          webhookSecret: ''
        }
      };
    } catch (error: any) {
      console.error('Error getting stripe config:', error);
      return { success: false, error: error.message };
    }
  }

  async updateStripeConfig(config: StripeConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('manage-system-config', {
        body: {
          action: 'update_system_config',
          config_key: 'stripe_configuration',
          config_type: 'stripe',
          config_value: config,
          description: 'Configuração de pagamentos via Stripe'
        }
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error updating stripe config:', error);
      return { success: false, error: error.message };
    }
  }

  // BulkSMS Configuration
  async getBulkSMSConfig(): Promise<{ success: boolean; data?: BulkSMSConfig; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('manage-system-config', {
        body: { action: 'get_system_config', config_type: 'sms' }
      });

      if (error) throw error;

      const smsConfig = data?.data?.find((config: any) => config.config_type === 'sms');
      
      return {
        success: true,
        data: smsConfig?.config_value || {
          tokenId: '',
          tokenSecret: ''
        }
      };
    } catch (error: any) {
      console.error('Error getting SMS config:', error);
      return { success: false, error: error.message };
    }
  }

  async updateBulkSMSConfig(config: BulkSMSConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('manage-system-config', {
        body: {
          action: 'update_system_config',
          config_key: 'bulksms_configuration',
          config_type: 'sms',
          config_value: config,
          description: 'Configuração de envio de SMS via BulkSMS'
        }
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error updating SMS config:', error);
      return { success: false, error: error.message };
    }
  }

  async testBulkSMSConfig(testPhone: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('send-otp-sms', {
        body: {
          phone: testPhone,
          otpCode: '123456',
          isTest: true
        }
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error testing SMS config:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all configurations
  async getAllConfigurations(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('manage-system-config', {
        body: { action: 'get_all_configs' }
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      console.error('Error getting all configurations:', error);
      return { success: false, error: error.message };
    }
  }
}

export const systemConfigService = new SystemConfigService();
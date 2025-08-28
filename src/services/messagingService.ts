import { supabase } from '@/integrations/supabase/client';

export interface MessageTemplate {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'push';
  category: 'otp' | 'welcome' | 'payment' | 'reminder' | 'notification' | 'marketing';
  subject?: string;
  content: string;
  variables: string[];
  language: string;
  is_default: boolean;
  is_active: boolean;
  version: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BulkCampaign {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'push';
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'failed';
  template_id: string;
  target_audience: 'all' | 'vip' | 'inactive' | 'custom';
  filters: BulkCampaignFilters;
  scheduled_at?: string;
  sent_at?: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  opened_count: number;
  clicked_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BulkCampaignFilters {
  user_types?: ('free' | 'vip')[];
  last_login_days?: number;
  countries?: string[];
  kyc_status?: ('pending' | 'verified' | 'rejected')[];
  custom_sql?: string;
}

export interface MessagingConfig {
  sms: {
    provider: 'bulksms' | 'twilio';
    enabled: boolean;
    sender_id?: string;
    rate_limit_per_number: number;
    rate_limit_window_minutes: number;
    timeout_seconds: number;
    max_attempts: number;
    allowed_countries: string[];
    blacklisted_numbers: string[];
  };
  email: {
    provider: 'resend' | 'sendgrid';
    enabled: boolean;
    from_name: string;
    from_email: string;
    reply_to?: string;
    rate_limit_per_email: number;
    rate_limit_window_minutes: number;
    bounce_handling_enabled: boolean;
    auto_retry_enabled: boolean;
    max_retry_attempts: number;
  };
  push: {
    enabled: boolean;
    fcm_server_key?: string;
    apns_certificate?: string;
  };
}

export interface MessageStats {
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  delivery_rate: number;
  campaigns_active: number;
  campaigns_completed: number;
  templates_active: number;
}

class MessagingService {
  // Template Management
  async getTemplates(type?: 'sms' | 'email' | 'push'): Promise<MessageTemplate[]> {
    try {
      let query = supabase
        .from('message_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching templates:', error);
        return [];
      }

      return data.map(template => ({
        ...template,
        variables: Array.isArray(template.variables) ? template.variables : []
      })) as MessageTemplate[];
    } catch (error) {
      console.error('Error in getTemplates:', error);
      return [];
    }
  }

  async createTemplate(template: Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('message_templates')
        .insert({
          ...template,
          variables: this.extractVariables(template.content)
        });

      if (error) {
        console.error('Error creating template:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createTemplate:', error);
      return false;
    }
  }

  async updateTemplate(id: string, template: Partial<MessageTemplate>): Promise<boolean> {
    try {
      const updateData = { ...template };
      
      if (template.content) {
        updateData.variables = this.extractVariables(template.content);
      }

      const { error } = await supabase
        .from('message_templates')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating template:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateTemplate:', error);
      return false;
    }
  }

  async deleteTemplate(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('message_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Error deleting template:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteTemplate:', error);
      return false;
    }
  }

  // Extract variables from template content (e.g., {user.name}, {group.title})
  extractVariables(content: string): string[] {
    const matches = content.match(/\{([^}]+)\}/g);
    if (!matches) return [];
    
    return matches.map(match => match.slice(1, -1)).filter((value, index, self) => 
      self.indexOf(value) === index
    );
  }

  // Test template with sample data
  async testTemplate(templateId: string, testData: Record<string, any>): Promise<{ success: boolean; preview: string; error?: string }> {
    try {
      const { data: template, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error || !template) {
        return { success: false, preview: '', error: 'Template not found' };
      }

      let preview = template.content;
      
      // Replace variables with test data
      Object.keys(testData).forEach(key => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        preview = preview.replace(regex, testData[key] || `{${key}}`);
      });

      return { success: true, preview };
    } catch (error) {
      return { success: false, preview: '', error: 'Error testing template' };
    }
  }

  // Bulk Campaign Management - Temporarily disabled until types are updated
  async createBulkCampaign(campaignData: any): Promise<string | null> {
    try {
      console.log('Bulk campaign creation temporarily disabled:', campaignData);
      throw new Error('Bulk campaigns feature is being prepared. Please try again later.');
    } catch (error) {
      console.error('Error creating bulk campaign:', error);
      throw error;
    }
  }

  async getBulkCampaigns(status?: string): Promise<BulkCampaign[]> {
    try {
      console.log('Bulk campaigns fetch temporarily disabled:', status);
      return [];
    } catch (error) {
      console.error('Error fetching bulk campaigns:', error);
      return [];
    }
  }

  async scheduleCampaign(campaignId: string, scheduledAt: Date): Promise<boolean> {
    try {
      console.log('Campaign scheduling temporarily disabled:', { campaignId, scheduledAt });
      return false;
    } catch (error) {
      console.error('Error scheduling campaign:', error);
      return false;
    }
  }

  async sendCampaignNow(campaignId: string): Promise<boolean> {
    try {
      console.log('Campaign sending temporarily disabled:', campaignId);
      return false;
    } catch (error) {
      console.error('Error sending campaign:', error);
      return false;
    }
  }

  // Configuration Management
  async getMessagingConfig(): Promise<MessagingConfig | null> {
    try {
      const { data, error } = await supabase
        .from('system_configurations')
        .select('config_value')
        .eq('config_key', 'messaging')
        .eq('config_type', 'messaging')
        .single();

      if (error) {
        console.error('Error fetching messaging config:', error);
        return this.getDefaultMessagingConfig();
      }

      return data?.config_value ? (data.config_value as unknown as MessagingConfig) : this.getDefaultMessagingConfig();
    } catch (error) {
      console.error('Error in getMessagingConfig:', error);
      return this.getDefaultMessagingConfig();
    }
  }

  async updateMessagingConfig(config: Partial<MessagingConfig>): Promise<boolean> {
    try {
      const currentConfig = await this.getMessagingConfig();
      const updatedConfig = { ...currentConfig, ...config };

      const { error } = await supabase
        .from('system_configurations')
        .upsert({
          config_key: 'messaging',
          config_type: 'messaging',
          config_value: updatedConfig as any,
          description: 'Configuração de mensagens e comunicação'
        });

      if (error) {
        console.error('Error updating messaging config:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateMessagingConfig:', error);
      return false;
    }
  }

  // Send individual message
  async sendMessage(type: 'sms' | 'email', recipient: string, templateId: string, variables: Record<string, any>): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('send-message', {
        body: { type, recipient, templateId, variables }
      });

      if (error) {
        console.error('Error sending message:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return false;
    }
  }

  // Statistics
  async getMessagingStats(): Promise<MessageStats> {
    try {
      // This would be implemented with proper aggregation queries
      // For now, returning mock data
      return {
        total_sent: 12450,
        total_delivered: 11890,
        total_failed: 560,
        delivery_rate: 95.5,
        campaigns_active: 3,
        campaigns_completed: 28,
        templates_active: 15
      };
    } catch (error) {
      console.error('Error in getMessagingStats:', error);
      return {
        total_sent: 0,
        total_delivered: 0,
        total_failed: 0,
        delivery_rate: 0,
        campaigns_active: 0,
        campaigns_completed: 0,
        templates_active: 0
      };
    }
  }

  // Helper methods
  private async getRecipientCount(audience: string, filters: BulkCampaignFilters): Promise<number> {
    try {
      let query = supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      if (audience === 'vip') {
        query = query.eq('is_vip', true);
      } else if (audience === 'inactive') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query.lt('last_login', thirtyDaysAgo.toISOString());
      }

      if (filters.user_types) {
        if (filters.user_types.includes('vip')) {
          query = query.eq('is_vip', true);
        }
      }

      if (filters.countries && filters.countries.length > 0) {
        query = query.in('country', filters.countries);
      }

      if (filters.kyc_status && filters.kyc_status.length > 0) {
        query = query.in('kyc_status', filters.kyc_status);
      }

      const { count, error } = await query;

      if (error) {
        console.error('Error getting recipient count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getRecipientCount:', error);
      return 0;
    }
  }

  private getDefaultMessagingConfig(): MessagingConfig {
    return {
      sms: {
        provider: 'bulksms',
        enabled: true,
        sender_id: 'KIXIKILA',
        rate_limit_per_number: 5,
        rate_limit_window_minutes: 60,
        timeout_seconds: 300,
        max_attempts: 3,
        allowed_countries: ['244', '351'], // Angola, Portugal
        blacklisted_numbers: []
      },
      email: {
        provider: 'resend',
        enabled: true,
        from_name: 'KIXIKILA',
        from_email: 'noreply@kixikila.pro',
        reply_to: 'support@kixikila.pro',
        rate_limit_per_email: 10,
        rate_limit_window_minutes: 60,
        bounce_handling_enabled: true,
        auto_retry_enabled: true,
        max_retry_attempts: 3
      },
      push: {
        enabled: false,
        fcm_server_key: undefined,
        apns_certificate: undefined
      }
    };
  }
}

export const messagingService = new MessagingService();
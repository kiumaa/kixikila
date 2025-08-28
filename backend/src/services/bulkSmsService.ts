import axios, { AxiosResponse } from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger';

interface BulkSmsConfig {
  username: string;
  password: string;
  from: string;
}

interface SendSmsRequest {
  to: string;
  message: string;
  from?: string;
}

interface SendSmsResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

interface BulkSmsApiResponse {
  id: string;
  type: string;
  from: string;
  to: string;
  body: string;
  encoding: string;
  protocolId: number;
  messageClass: number;
  autoUnicode: boolean;
  numberOfParts: number;
  cost: number;
  submission: {
    date: string;
    requestId: string;
  };
  status: {
    id: string;
    type: string;
    subtype: string;
  };
  relatedSentMessageId?: string;
}

class BulkSmsService {
  private config: BulkSmsConfig;
  private baseUrl = 'https://api.bulksms.com/v1';
  private isConfigured: boolean;

  constructor() {
    this.config = {
      username: config.bulkSms.username,
      password: config.bulkSms.password,
      from: config.bulkSms.from
    };

    this.isConfigured = !!(this.config.username && this.config.password);

    if (!this.isConfigured) {
      logger.warn('BulkSMS service not configured - SMS functionality will be disabled');
    } else {
      logger.info('BulkSMS service initialized successfully');
    }
  }

  /**
   * Check if BulkSMS service is properly configured
   */
  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Send SMS message
   */
  async sendSms(request: SendSmsRequest): Promise<SendSmsResponse> {
    try {
      if (!this.isConfigured) {
        logger.warn('Attempted to send SMS but service is not configured');
        return {
          success: false,
          error: 'BulkSMS service not configured'
        };
      }

      // Validate phone number format
      const phoneNumber = this.formatPhoneNumber(request.to);
      if (!phoneNumber) {
        return {
          success: false,
          error: 'Invalid phone number format'
        };
      }

      // Prepare request data
      const smsData = {
        to: phoneNumber,
        body: request.message,
        from: request.from || this.config.from
      };

      logger.info('Sending SMS', {
        to: phoneNumber,
        from: smsData.from,
        messageLength: request.message.length
      });

      // Make API request
      const response: AxiosResponse<BulkSmsApiResponse[]> = await axios.post(
        `${this.baseUrl}/messages`,
        [smsData],
        {
          auth: {
            username: this.config.username,
            password: this.config.password
          },
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      if (response.status === 201 && response.data && response.data.length > 0) {
        const messageData = response.data[0];
        
        logger.info('SMS sent successfully', {
          messageId: messageData.id,
          to: phoneNumber,
          cost: messageData.cost,
          status: messageData.status
        });

        return {
          success: true,
          messageId: messageData.id,
          details: {
            cost: messageData.cost,
            numberOfParts: messageData.numberOfParts,
            status: messageData.status
          }
        };
      } else {
        logger.error('Unexpected response from BulkSMS API', {
          status: response.status,
          data: response.data
        });
        
        return {
          success: false,
          error: 'Unexpected response from SMS service'
        };
      }
    } catch (error: any) {
      logger.error('Failed to send SMS', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      let errorMessage = 'Failed to send SMS';
      
      if (error.response?.status === 401) {
        errorMessage = 'SMS service authentication failed';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid SMS request data';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'SMS service timeout';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      return {
        success: false,
        error: errorMessage,
        details: error.response?.data
      };
    }
  }

  /**
   * Send OTP SMS
   */
  async sendOtpSms(phoneNumber: string, otpCode: string): Promise<SendSmsResponse> {
    const message = `Seu código de verificação KIXIKILA é: ${otpCode}. Este código expira em 5 minutos. Não compartilhe este código com ninguém.`;
    
    return this.sendSms({
      to: phoneNumber,
      message
    });
  }

  /**
   * Send notification SMS
   */
  async sendNotificationSms(
    phoneNumber: string, 
    title: string, 
    message: string
  ): Promise<SendSmsResponse> {
    const smsMessage = `KIXIKILA - ${title}: ${message}`;
    
    return this.sendSms({
      to: phoneNumber,
      message: smsMessage
    });
  }

  /**
   * Send transaction notification SMS
   */
  async sendTransactionSms(
    phoneNumber: string,
    transactionType: 'deposit' | 'withdrawal' | 'transfer',
    amount: number,
    groupName: string
  ): Promise<SendSmsResponse> {
    let message: string;
    
    switch (transactionType) {
      case 'deposit':
        message = `Depósito de ${amount} AOA realizado no grupo "${groupName}". Verifique o app para mais detalhes.`;
        break;
      case 'withdrawal':
        message = `Saque de ${amount} AOA realizado no grupo "${groupName}". Verifique o app para mais detalhes.`;
        break;
      case 'transfer':
        message = `Transferência de ${amount} AOA realizada no grupo "${groupName}". Verifique o app para mais detalhes.`;
        break;
      default:
        message = `Transação de ${amount} AOA realizada no grupo "${groupName}". Verifique o app para mais detalhes.`;
    }

    return this.sendSms({
      to: phoneNumber,
      message: `KIXIKILA - ${message}`
    });
  }

  /**
   * Send group invitation SMS
   */
  async sendGroupInvitationSms(
    phoneNumber: string,
    groupName: string,
    inviterName: string
  ): Promise<SendSmsResponse> {
    const message = `${inviterName} convidou você para participar do grupo "${groupName}" no KIXIKILA. Baixe o app para aceitar o convite.`;
    
    return this.sendSms({
      to: phoneNumber,
      message
    });
  }

  /**
   * Format phone number to international format
   */
  private formatPhoneNumber(phoneNumber: string): string | null {
    try {
      // Remove all non-digit characters
      let cleaned = phoneNumber.replace(/\D/g, '');
      
      // Handle Angola phone numbers
      if (cleaned.startsWith('244')) {
        // Already has country code
        return `+${cleaned}`;
      } else if (cleaned.startsWith('9') && cleaned.length === 9) {
        // Angola mobile number without country code
        return `+244${cleaned}`;
      } else if (cleaned.length === 9 && /^[9]/.test(cleaned)) {
        // Angola mobile number
        return `+244${cleaned}`;
      } else if (cleaned.length === 10 && cleaned.startsWith('0')) {
        // Remove leading zero and add country code
        return `+244${cleaned.substring(1)}`;
      }
      
      // For other international numbers, assume they're already formatted correctly
      if (cleaned.length >= 10 && cleaned.length <= 15) {
        return `+${cleaned}`;
      }
      
      return null;
    } catch (error) {
      logger.error('Error formatting phone number', { phoneNumber, error });
      return null;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<{ success: boolean; balance?: number; currency?: string; error?: string }> {
    try {
      if (!this.isConfigured) {
        return {
          success: false,
          error: 'BulkSMS service not configured'
        };
      }

      const response = await axios.get(`${this.baseUrl}/profile`, {
        auth: {
          username: this.config.username,
          password: this.config.password
        },
        timeout: 10000
      });

      if (response.status === 200 && response.data) {
        logger.info('BulkSMS balance retrieved', {
          balance: response.data.credit?.balance,
          currency: response.data.credit?.currency
        });

        return {
          success: true,
          balance: response.data.credit?.balance,
          currency: response.data.credit?.currency
        };
      }

      return {
        success: false,
        error: 'Failed to retrieve balance'
      };
    } catch (error: any) {
      logger.error('Failed to get BulkSMS balance', {
        error: error.message,
        status: error.response?.status
      });

      return {
        success: false,
        error: 'Failed to retrieve balance'
      };
    }
  }

  /**
   * Test SMS service connectivity
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isConfigured) {
        return {
          success: false,
          error: 'BulkSMS service not configured'
        };
      }

      const balanceResult = await this.getBalance();
      
      if (balanceResult.success) {
        logger.info('BulkSMS connection test successful');
        return { success: true };
      } else {
        return {
          success: false,
          error: balanceResult.error || 'Connection test failed'
        };
      }
    } catch (error: any) {
      logger.error('BulkSMS connection test failed', { error: error.message });
      return {
        success: false,
        error: 'Connection test failed'
      };
    }
  }
}

export const bulkSmsService = new BulkSmsService();
export default bulkSmsService;
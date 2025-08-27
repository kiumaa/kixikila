import axios from 'axios';
import { config } from '../config/index.ts';
import { logger } from '../utils/logger.ts';

interface SMSOptions {
  to: string;
  message: string;
}

interface BulkSMSResponse {
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
  creditCost: number;
}

class SMSService {
  private apiUrl: string;
  private apiKey: string;
  private username: string;
  private password: string;

  constructor() {
    this.apiUrl = 'https://api.bulksms.com/v1/messages';
    this.apiKey = config.bulkSms.apiKey;
    this.username = config.bulkSms.username;
    this.password = config.bulkSms.password;
  }

  /**
   * Send SMS using BulkSMS API
   */
  private async sendSMS(options: SMSOptions): Promise<boolean> {
    try {
      const payload = {
        to: this.formatPhoneNumber(options.to),
        body: options.message,
        from: 'KIXIKILA'
      };

      const response = await axios.post<BulkSMSResponse[]>(
        this.apiUrl,
        payload,
        {
          auth: {
            username: this.username,
            password: this.password
          },
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'KIXIKILA/1.0'
          },
          timeout: 10000
        }
      );

      if (response.status === 201 && response.data && response.data.length > 0) {
        const smsData = response.data[0];
        
        logger.info('SMS sent successfully', {
          to: options.to,
          messageId: smsData.id,
          cost: smsData.cost,
          parts: smsData.numberOfParts
        });

        return true;
      } else {
        logger.error('SMS sending failed - Invalid response', {
          to: options.to,
          status: response.status,
          data: response.data
        });
        return false;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('SMS sending failed - API Error', {
          to: options.to,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
      } else {
        logger.error('SMS sending failed - Unknown Error', {
          to: options.to,
          error: error.message
        });
      }
      return false;
    }
  }

  /**
   * Format phone number for international format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If number starts with 0, assume it's a local number and add country code
    if (cleaned.startsWith('0')) {
      cleaned = '244' + cleaned.substring(1); // Angola country code
    }
    
    // If number doesn't start with country code, add it
    if (!cleaned.startsWith('244')) {
      cleaned = '244' + cleaned;
    }
    
    return '+' + cleaned;
  }

  /**
   * Send OTP SMS for phone verification
   */
  async sendPhoneVerificationSMS(phoneNumber: string, fullName: string, otp: string): Promise<boolean> {
    const message = `KIXIKILA: Olá ${fullName}! Seu código de verificação é: ${otp}. Este código expira em 10 minutos. Nunca compartilhe este código.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  /**
   * Send password reset OTP SMS
   */
  async sendPasswordResetSMS(phoneNumber: string, fullName: string, otp: string): Promise<boolean> {
    const message = `KIXIKILA: ${fullName}, seu código para redefinir a senha é: ${otp}. Válido por 10 minutos. Se não foi você, ignore esta mensagem.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  /**
   * Send welcome SMS
   */
  async sendWelcomeSMS(phoneNumber: string, fullName: string): Promise<boolean> {
    const message = `KIXIKILA: Bem-vindo ${fullName}! 🎉 Sua conta foi criada com sucesso. Comece a poupar em grupo e alcance seus objetivos financeiros!`;
    
    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  /**
   * Send group invitation SMS
   */
  async sendGroupInvitationSMS(
    phoneNumber: string,
    inviteeName: string,
    inviterName: string,
    groupName: string
  ): Promise<boolean> {
    const message = `KIXIKILA: ${inviteeName}, ${inviterName} convidou você para o grupo "${groupName}". Acesse o app para aceitar o convite!`;
    
    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  /**
   * Send contribution reminder SMS
   */
  async sendContributionReminderSMS(
    phoneNumber: string,
    memberName: string,
    groupName: string,
    amount: number,
    dueDate: string
  ): Promise<boolean> {
    const message = `KIXIKILA: ${memberName}, lembrete: contribuição de ${amount} AOA para o grupo "${groupName}" vence em ${dueDate}. Não perca o prazo!`;
    
    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  /**
   * Send contribution received SMS
   */
  async sendContributionReceivedSMS(
    phoneNumber: string,
    memberName: string,
    groupName: string,
    amount: number,
    contributorName: string
  ): Promise<boolean> {
    const message = `KIXIKILA: ${memberName}, ${contributorName} fez uma contribuição de ${amount} AOA no grupo "${groupName}". Verifique o progresso no app!`;
    
    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  /**
   * Send goal achieved SMS
   */
  async sendGoalAchievedSMS(
    phoneNumber: string,
    memberName: string,
    groupName: string,
    goalAmount: number
  ): Promise<boolean> {
    const message = `KIXIKILA: 🎉 Parabéns ${memberName}! O grupo "${groupName}" atingiu a meta de ${goalAmount} AOA! Verifique os detalhes no app.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  /**
   * Send payment due SMS
   */
  async sendPaymentDueSMS(
    phoneNumber: string,
    memberName: string,
    amount: number,
    description: string
  ): Promise<boolean> {
    const message = `KIXIKILA: ${memberName}, você tem um pagamento pendente de ${amount} AOA para "${description}". Efetue o pagamento no app.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  /**
   * Send VIP subscription SMS
   */
  async sendVIPSubscriptionSMS(
    phoneNumber: string,
    memberName: string,
    planName: string,
    expiryDate: string
  ): Promise<boolean> {
    const message = `KIXIKILA: ${memberName}, sua assinatura VIP "${planName}" foi ativada! Válida até ${expiryDate}. Aproveite os benefícios exclusivos!`;
    
    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  /**
   * Send security alert SMS
   */
  async sendSecurityAlertSMS(
    phoneNumber: string,
    memberName: string,
    action: string,
    timestamp: string
  ): Promise<boolean> {
    const message = `KIXIKILA: Alerta de segurança ${memberName}! ${action} em ${timestamp}. Se não foi você, altere sua senha imediatamente.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  /**
   * Send custom notification SMS
   */
  async sendNotificationSMS(
    phoneNumber: string,
    memberName: string,
    title: string,
    message: string
  ): Promise<boolean> {
    const smsMessage = `KIXIKILA: ${memberName}, ${title}: ${message}`;
    
    return this.sendSMS({
      to: phoneNumber,
      message: smsMessage
    });
  }

  /**
   * Send general notification SMS
   */
  async sendNotificationSMS(
    phoneNumber: string, 
    userName: string, 
    title: string, 
    message: string
  ): Promise<boolean> {
    try {
      const smsMessage = `${title}\n\nOlá ${userName},\n\n${message}\n\nKIXIKILA - Gestão Financeira`;
      
      return await this.sendSMS({
        to: phoneNumber,
        message: smsMessage
      });
    } catch (error) {
      logger.error('Error sending notification SMS:', error);
      return false;
    }
  }

  /**
   * Send payment reminder SMS
   */
  async sendPaymentReminderSMS(
    phoneNumber: string, 
    userName: string, 
    groupName: string, 
    amount: number, 
    dueDate: string
  ): Promise<boolean> {
    try {
      const smsMessage = `Lembrete de Pagamento\n\nOlá ${userName},\n\nLembramos que tem uma contribuição pendente no grupo "${groupName}":\n\nValor: ${amount} AOA\nData limite: ${dueDate}\n\nPor favor, efetue o pagamento o mais breve possível.\n\nKIXIKILA - Gestão Financeira`;
      
      return await this.sendSMS({
        to: phoneNumber,
        message: smsMessage
      });
    } catch (error) {
      logger.error('Error sending payment reminder SMS:', error);
      return false;
    }
  }

  /**
   * Send group activity notification SMS
   */
  async sendGroupActivitySMS(
    phoneNumber: string, 
    userName: string, 
    groupName: string, 
    activity: string
  ): Promise<boolean> {
    try {
      const smsMessage = `Atividade no Grupo\n\nOlá ${userName},\n\nNova atividade no grupo "${groupName}":\n\n${activity}\n\nAcesse o KIXIKILA para mais detalhes.\n\nKIXIKILA - Gestão Financeira`;
      
      return await this.sendSMS({
        to: phoneNumber,
        message: smsMessage
      });
    } catch (error) {
      logger.error('Error sending group activity SMS:', error);
      return false;
    }
  }

  /**
   * Check service health
   */
  async checkHealth(): Promise<boolean> {
    try {
      // Test with a simple API call to check credits
      const response = await axios.get('https://api.bulksms.com/v1/profile', {
        auth: {
          username: this.username,
          password: this.password
        },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return response.status === 200;
    } catch (error) {
      logger.error('SMS service health check failed:', error);
      return false;
    }
  }
}

export const smsService = new SMSService();
export default smsService;
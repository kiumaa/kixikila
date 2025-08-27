import nodemailer from 'nodemailer';
import { config } from '../config/index.ts';
import { logger } from '../utils/logger.ts';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  /**
   * Verify SMTP connection
   */
  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('✅ Email service connected successfully');
    } catch (error) {
      logger.error('❌ Email service connection failed:', error);
    }
  }

  /**
   * Send email
   */
  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"KIXIKILA" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send email:', {
        to: options.to,
        subject: options.subject,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Send email verification OTP
   */
  async sendVerificationEmail(email: string, fullName: string, otp: string): Promise<boolean> {
    const subject = 'Verificação de Email - KIXIKILA';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verificação de Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 KIXIKILA</h1>
            <p>Verificação de Email</p>
          </div>
          <div class="content">
            <h2>Olá, ${fullName}!</h2>
            <p>Obrigado por se registrar na KIXIKILA! Para completar o seu registro, por favor verifique o seu endereço de email usando o código abaixo:</p>
            
            <div class="otp-box">
              <p>Seu código de verificação é:</p>
              <div class="otp-code">${otp}</div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este código expira em 10 minutos</li>
                <li>Use este código apenas no aplicativo KIXIKILA</li>
                <li>Nunca compartilhe este código com terceiros</li>
              </ul>
            </div>
            
            <p>Se você não solicitou esta verificação, pode ignorar este email com segurança.</p>
            
            <p>Bem-vindo à comunidade KIXIKILA! 🎉</p>
          </div>
          <div class="footer">
            <p>© 2024 KIXIKILA. Todos os direitos reservados.</p>
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      KIXIKILA - Verificação de Email
      
      Olá, ${fullName}!
      
      Seu código de verificação é: ${otp}
      
      Este código expira em 10 minutos.
      
      Se você não solicitou esta verificação, pode ignorar este email.
      
      © 2024 KIXIKILA
    `;

    return this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Send password reset OTP
   */
  async sendPasswordResetEmail(email: string, fullName: string, otp: string): Promise<boolean> {
    const subject = 'Redefinição de Senha - KIXIKILA';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redefinição de Senha</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #ff6b6b; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #ff6b6b; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .security-notice { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 KIXIKILA</h1>
            <p>Redefinição de Senha</p>
          </div>
          <div class="content">
            <h2>Olá, ${fullName}!</h2>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta KIXIKILA. Use o código abaixo para criar uma nova senha:</p>
            
            <div class="otp-box">
              <p>Seu código de redefinição é:</p>
              <div class="otp-code">${otp}</div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este código expira em 10 minutos</li>
                <li>Use este código apenas no aplicativo KIXIKILA</li>
                <li>Nunca compartilhe este código com terceiros</li>
              </ul>
            </div>
            
            <div class="security-notice">
              <strong>🛡️ Aviso de Segurança:</strong>
              <p>Se você não solicitou esta redefinição de senha, sua conta pode estar em risco. Recomendamos que:</p>
              <ul>
                <li>Ignore este email</li>
                <li>Verifique a segurança da sua conta</li>
                <li>Entre em contato conosco se suspeitar de atividade suspeita</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>© 2024 KIXIKILA. Todos os direitos reservados.</p>
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      KIXIKILA - Redefinição de Senha
      
      Olá, ${fullName}!
      
      Seu código de redefinição de senha é: ${otp}
      
      Este código expira em 10 minutos.
      
      Se você não solicitou esta redefinição, ignore este email.
      
      © 2024 KIXIKILA
    `;

    return this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, fullName: string): Promise<boolean> {
    const subject = 'Bem-vindo à KIXIKILA! 🎉';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo à KIXIKILA</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .feature-box { background: white; padding: 20px; margin: 15px 0; border-radius: 10px; border-left: 4px solid #667eea; }
          .cta-button { background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 KIXIKILA</h1>
            <p>Bem-vindo à nossa comunidade!</p>
          </div>
          <div class="content">
            <h2>Olá, ${fullName}! 👋</h2>
            <p>É com grande prazer que damos as boas-vindas à KIXIKILA, a plataforma que vai revolucionar a forma como você poupa e investe em grupo!</p>
            
            <div class="feature-box">
              <h3>🎯 O que você pode fazer:</h3>
              <ul>
                <li>Criar e participar de grupos de poupança</li>
                <li>Definir metas financeiras colaborativas</li>
                <li>Receber notificações de contribuições</li>
                <li>Acompanhar o progresso do seu grupo</li>
              </ul>
            </div>
            
            <div class="feature-box">
              <h3>💎 Benefícios VIP:</h3>
              <ul>
                <li>Grupos ilimitados</li>
                <li>Relatórios avançados</li>
                <li>Suporte prioritário</li>
                <li>Funcionalidades exclusivas</li>
              </ul>
            </div>
            
            <p>Estamos aqui para ajudá-lo a alcançar seus objetivos financeiros de forma colaborativa e segura.</p>
            
            <p>Vamos começar esta jornada juntos! 🚀</p>
          </div>
          <div class="footer">
            <p>© 2024 KIXIKILA. Todos os direitos reservados.</p>
            <p>Precisa de ajuda? Entre em contato conosco!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Bem-vindo à KIXIKILA!
      
      Olá, ${fullName}!
      
      É com grande prazer que damos as boas-vindas à KIXIKILA!
      
      O que você pode fazer:
      - Criar e participar de grupos de poupança
      - Definir metas financeiras colaborativas
      - Receber notificações de contribuições
      - Acompanhar o progresso do seu grupo
      
      Vamos começar esta jornada juntos!
      
      © 2024 KIXIKILA
    `;

    return this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Send notification email
   */
  async sendNotificationEmail(
    email: string,
    fullName: string,
    title: string,
    message: string,
    actionUrl?: string
  ): Promise<boolean> {
    const subject = `KIXIKILA - ${title}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .message-box { background: white; padding: 20px; margin: 20px 0; border-radius: 10px; border-left: 4px solid #667eea; }
          .cta-button { background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 KIXIKILA</h1>
            <p>${title}</p>
          </div>
          <div class="content">
            <h2>Olá, ${fullName}!</h2>
            
            <div class="message-box">
              <p>${message}</p>
            </div>
            
            ${actionUrl ? `<a href="${actionUrl}" class="cta-button">Ver Detalhes</a>` : ''}
            
            <p>Obrigado por usar a KIXIKILA!</p>
          </div>
          <div class="footer">
            <p>© 2024 KIXIKILA. Todos os direitos reservados.</p>
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      KIXIKILA - ${title}
      
      Olá, ${fullName}!
      
      ${message}
      
      ${actionUrl ? `Ver detalhes: ${actionUrl}` : ''}
      
      © 2024 KIXIKILA
    `;

    return this.sendEmail({ to: email, subject, html, text });
  }
}

export const emailService = new EmailService();
export default emailService;
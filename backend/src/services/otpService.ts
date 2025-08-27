import { supabaseAdmin } from './supabase.ts';
import { logger } from '../utils/logger.ts';
import crypto from 'crypto';

interface OtpRecord {
  id: string;
  identifier: string; // email or phone
  otp: string;
  type: 'email_verification' | 'phone_verification' | 'password_reset' | 'two_factor';
  expires_at: string;
  attempts: number;
  is_used: boolean;
  created_at: string;
}

class OtpService {
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_ATTEMPTS = 3;
  private readonly RATE_LIMIT_MINUTES = 1; // Minimum time between OTP requests

  /**
   * Generate a new OTP
   */
  async generateOtp(
    identifier: string, 
    type: OtpRecord['type']
  ): Promise<string> {
    // Check rate limiting
    await this.checkRateLimit(identifier, type);

    // Invalidate any existing OTPs for this identifier and type
    await this.invalidateExistingOtps(identifier, type);

    // Generate random OTP
    const otp = this.generateRandomOtp();
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP in database
    const { error } = await supabaseAdmin
      .from('otps')
      .insert({
        identifier,
        otp: await this.hashOtp(otp),
        type,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        is_used: false,
      });

    if (error) {
      logger.error('Failed to store OTP:', error);
      throw new Error('Failed to generate OTP');
    }

    logger.info('OTP generated successfully', {
      identifier,
      type,
      expiresAt: expiresAt.toISOString(),
    });

    return otp;
  }

  /**
   * Verify an OTP
   */
  async verifyOtp(
    identifier: string,
    otp: string,
    type: OtpRecord['type']
  ): Promise<boolean> {
    // Get the most recent valid OTP
    const { data: otpRecord, error } = await supabaseAdmin
      .from('otps')
      .select('*')
      .eq('identifier', identifier)
      .eq('type', type)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !otpRecord) {
      logger.warn('OTP not found or expired', {
        identifier,
        type,
        error: error?.message,
      });
      return false;
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= this.MAX_ATTEMPTS) {
      logger.warn('Max OTP attempts exceeded', {
        identifier,
        type,
        attempts: otpRecord.attempts,
      });
      
      // Mark as used to prevent further attempts
      await this.markOtpAsUsed(otpRecord.id);
      return false;
    }

    // Increment attempt count
    await this.incrementAttempts(otpRecord.id);

    // Verify OTP
    const isValid = await this.compareOtp(otp, otpRecord.otp);

    if (isValid) {
      // Mark OTP as used
      await this.markOtpAsUsed(otpRecord.id);
      
      logger.info('OTP verified successfully', {
        identifier,
        type,
        attempts: otpRecord.attempts + 1,
      });
    } else {
      logger.warn('Invalid OTP provided', {
        identifier,
        type,
        attempts: otpRecord.attempts + 1,
      });
    }

    return isValid;
  }

  /**
   * Check rate limiting for OTP generation
   */
  private async checkRateLimit(
    identifier: string,
    type: OtpRecord['type']
  ): Promise<void> {
    const rateLimitTime = new Date(Date.now() - this.RATE_LIMIT_MINUTES * 60 * 1000);

    const { data: recentOtp } = await supabaseAdmin
      .from('otps')
      .select('created_at')
      .eq('identifier', identifier)
      .eq('type', type)
      .gt('created_at', rateLimitTime.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recentOtp) {
      const timeSinceLastOtp = Date.now() - new Date(recentOtp.created_at).getTime();
      const remainingTime = Math.ceil((this.RATE_LIMIT_MINUTES * 60 * 1000 - timeSinceLastOtp) / 1000);
      
      throw new Error(`Please wait ${remainingTime} seconds before requesting a new OTP`);
    }
  }

  /**
   * Invalidate existing OTPs for identifier and type
   */
  private async invalidateExistingOtps(
    identifier: string,
    type: OtpRecord['type']
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('otps')
      .update({ is_used: true })
      .eq('identifier', identifier)
      .eq('type', type)
      .eq('is_used', false);

    if (error) {
      logger.error('Failed to invalidate existing OTPs:', error);
    }
  }

  /**
   * Generate a random OTP
   */
  private generateRandomOtp(): string {
    const min = Math.pow(10, this.OTP_LENGTH - 1);
    const max = Math.pow(10, this.OTP_LENGTH) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  /**
   * Hash an OTP for secure storage
   */
  private async hashOtp(otp: string): Promise<string> {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  /**
   * Compare provided OTP with hashed OTP
   */
  private async compareOtp(providedOtp: string, hashedOtp: string): Promise<boolean> {
    const hashedProvidedOtp = await this.hashOtp(providedOtp);
    return hashedProvidedOtp === hashedOtp;
  }

  /**
   * Mark OTP as used
   */
  private async markOtpAsUsed(otpId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('otps')
      .update({ is_used: true })
      .eq('id', otpId);

    if (error) {
      logger.error('Failed to mark OTP as used:', error);
    }
  }

  /**
   * Increment attempt count
   */
  private async incrementAttempts(otpId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .rpc('increment_otp_attempts', { otp_id: otpId });

    if (error) {
      // Fallback to manual increment if RPC function doesn't exist
      const { data: otpRecord } = await supabaseAdmin
        .from('otps')
        .select('attempts')
        .eq('id', otpId)
        .single();

      if (otpRecord) {
        await supabaseAdmin
          .from('otps')
          .update({ attempts: otpRecord.attempts + 1 })
          .eq('id', otpId);
      }
    }
  }

  /**
   * Clean up expired OTPs (should be called periodically)
   */
  async cleanupExpiredOtps(): Promise<void> {
    const { error } = await supabaseAdmin
      .from('otps')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      logger.error('Failed to cleanup expired OTPs:', error);
    } else {
      logger.info('Expired OTPs cleaned up successfully');
    }
  }

  /**
   * Get OTP statistics for monitoring
   */
  async getOtpStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    expired: number;
    used: number;
  }> {
    const { data: stats } = await supabaseAdmin
      .from('otps')
      .select('type, is_used, expires_at');

    if (!stats) {
      return { total: 0, byType: {}, expired: 0, used: 0 };
    }

    const now = new Date();
    const byType: Record<string, number> = {};
    let expired = 0;
    let used = 0;

    stats.forEach(otp => {
      byType[otp.type] = (byType[otp.type] || 0) + 1;
      
      if (otp.is_used) {
        used++;
      }
      
      if (new Date(otp.expires_at) < now) {
        expired++;
      }
    });

    return {
      total: stats.length,
      byType,
      expired,
      used,
    };
  }
}

export const otpService = new OtpService();
export default otpService;
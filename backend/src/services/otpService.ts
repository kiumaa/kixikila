import { supabaseAdmin } from './supabase';
import { logger } from '../utils/logger';
import crypto from 'crypto';

interface OtpRecord {
  id: string;
  user_id?: string;
  type: string;
  code: string;
  status: 'pending' | 'verified' | 'expired' | 'used';
  expires_at: string;
  attempts: number;
  max_attempts: number;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

class OtpService {
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
  private readonly MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10);
  private readonly RATE_LIMIT_MINUTES = parseInt(process.env.OTP_RATE_LIMIT_MINUTES || '2', 10);

  /**
   * Generate a new OTP
   */
  async generateOtp(
    identifier: string, 
    type: OtpRecord['type'],
    userId?: string
  ): Promise<string> {
    // Check rate limiting
    await this.checkRateLimit(identifier, type);

    // Invalidate any existing OTPs for this identifier and type
    await this.invalidateExistingOtps(identifier, type);

    // Generate random OTP
    const otp = this.generateRandomOtp();
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP in database using otp_codes table
    const { error } = await supabaseAdmin
      .from('otp_codes')
      .insert({
        user_id: userId,
        type,
        code: otp, // Store plain OTP (should be hashed in production)
        expires_at: expiresAt.toISOString(),
        status: 'pending',
        attempts: 0,
        max_attempts: this.MAX_ATTEMPTS
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
    try {
      // Find the OTP record by user_id or type (since we don't store identifier separately)
      const { data: otpRecords, error } = await supabaseAdmin
        .from('otp_codes')
        .select('*')
        .eq('type', type)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(10); // Get recent OTPs

      if (error) {
        logger.error('Error fetching OTP:', error);
        return false;
      }

      if (!otpRecords || otpRecords.length === 0) {
        logger.warn(`No valid OTP found for type ${type}`);
        return false;
      }

      // Find matching OTP
      const otpRecord = otpRecords.find(record => record.code === otp);

      if (!otpRecord) {
        logger.warn(`Invalid OTP provided for type ${type}`);
        return false;
      }

      // Check if max attempts exceeded
      if (otpRecord.attempts >= otpRecord.max_attempts) {
        logger.warn(`Max attempts exceeded for OTP: ${otpRecord.id}`);
        await this.markOtpAsUsed(otpRecord.id);
        return false;
      }

      // Mark as verified
      await this.markOtpAsUsed(otpRecord.id);
      logger.info(`OTP verified successfully for type ${type}`);
      return true;

    } catch (error) {
      logger.error('Error verifying OTP:', error);
      return false;
    }
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
      .from('otp_codes')
      .select('created_at')
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
      .from('otp_codes')
      .update({ status: 'expired' })
      .eq('type', type)
      .eq('status', 'pending');

    if (error) {
      logger.error('Error invalidating existing OTPs:', error);
      throw new Error('Failed to invalidate existing OTPs');
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
      .from('otp_codes')
      .update({ 
        status: 'verified',
        verified_at: new Date().toISOString()
      })
      .eq('id', otpId);

    if (error) {
      logger.error('Error marking OTP as used:', error);
    }
  }

  /**
   * Increment attempt count
   */
  private async incrementAttempts(otpId: string): Promise<void> {
    const { data: otpRecord } = await supabaseAdmin
      .from('otp_codes')
      .select('attempts')
      .eq('id', otpId)
      .single();

    if (otpRecord) {
      await supabaseAdmin
        .from('otp_codes')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpId);
    }
  }

  /**
   * Clean up expired OTPs (should be called periodically)
   */
  async cleanupExpiredOtps(): Promise<void> {
    const { error } = await supabaseAdmin
      .from('otp_codes')
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
      .from('otp_codes')
      .select('type, status, expires_at');

    if (!stats) {
      return { total: 0, byType: {}, expired: 0, used: 0 };
    }

    const now = new Date();
    const byType: Record<string, number> = {};
    let expired = 0;
    let used = 0;

    stats.forEach(otp => {
      byType[otp.type] = (byType[otp.type] || 0) + 1;
      
      if (otp.status === 'verified') {
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
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase, supabaseAdmin } from '../services/supabase.ts';
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError,
  AuthorizationError,
  asyncHandler 
} from '../middleware/errorHandler.ts';
import { logger } from '../utils/logger.ts';
import { config } from '../config/index.ts';
import { otpService } from '../services/otpService.ts';
import { emailService } from '../services/emailService.ts';
import { smsService } from '../services/smsService.ts';

class UserController {
  /**
   * Get user profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        date_of_birth,
        address,
        city,
        country,
        role,
        is_vip,
        email_verified,
        phone_verified,
        avatar_url,
        created_at,
        updated_at
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      logger.error('Failed to fetch user profile:', error);
      throw new NotFoundError('User not found');
    }

    logger.info('User profile retrieved successfully', { userId });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          dateOfBirth: user.date_of_birth,
          address: user.address,
          city: user.city,
          country: user.country,
          role: user.role,
          isVip: user.is_vip,
          emailVerified: user.email_verified,
          phoneVerified: user.phone_verified,
          avatarUrl: user.avatar_url,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      },
      message: 'Profile retrieved successfully'
    });
  });

  /**
   * Update user profile
   */
  updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const {
      fullName,
      phone,
      dateOfBirth,
      address,
      city,
      country,
      avatarUrl
    } = req.body;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Check if phone number is already taken by another user
    if (phone) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', phone)
        .neq('id', userId)
        .single();

      if (existingUser) {
        throw new ConflictError('Phone number already in use');
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (fullName !== undefined) updateData.full_name = fullName;
    if (phone !== undefined) {
      updateData.phone = phone;
      updateData.phone_verified = false; // Reset verification when phone changes
    }
    if (dateOfBirth !== undefined) updateData.date_of_birth = dateOfBirth;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (country !== undefined) updateData.country = country;
    if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select(`
        id,
        email,
        full_name,
        phone,
        date_of_birth,
        address,
        city,
        country,
        role,
        is_vip,
        email_verified,
        phone_verified,
        avatar_url,
        updated_at
      `)
      .single();

    if (error) {
      logger.error('Failed to update user profile:', error);
      throw new ValidationError('Failed to update profile');
    }

    logger.info('User profile updated successfully', { userId });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          fullName: updatedUser.full_name,
          phone: updatedUser.phone,
          dateOfBirth: updatedUser.date_of_birth,
          address: updatedUser.address,
          city: updatedUser.city,
          country: updatedUser.country,
          role: updatedUser.role,
          isVip: updatedUser.is_vip,
          emailVerified: updatedUser.email_verified,
          phoneVerified: updatedUser.phone_verified,
          avatarUrl: updatedUser.avatar_url,
          updatedAt: updatedUser.updated_at
        }
      },
      message: 'Profile updated successfully'
    });
  });

  /**
   * Verify phone number
   */
  verifyPhone = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { otp } = req.body;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (!otp) {
      throw new ValidationError('OTP is required');
    }

    // Verify OTP
    const isValidOtp = await otpService.verifyOtp(userId, otp, 'phone_verification');
    
    if (!isValidOtp) {
      throw new ValidationError('Invalid or expired OTP');
    }

    // Update phone verification status
    const { error } = await supabaseAdmin
      .from('users')
      .update({ 
        phone_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      logger.error('Failed to update phone verification status:', error);
      throw new ValidationError('Failed to verify phone');
    }

    logger.info('Phone verified successfully', { userId });

    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully'
    });
  });

  /**
   * Send phone verification OTP
   */
  sendPhoneVerification = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Get user's phone number
    const { data: user, error } = await supabase
      .from('users')
      .select('phone, phone_verified')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new NotFoundError('User not found');
    }

    if (!user.phone) {
      throw new ValidationError('Phone number not set');
    }

    if (user.phone_verified) {
      throw new ValidationError('Phone number already verified');
    }

    // Generate and send OTP
    const otp = await otpService.generateOtp(userId, 'phone_verification');
    
    try {
      await smsService.sendSMS({
        to: user.phone,
        message: `Your KIXIKILA verification code is: ${otp}. This code expires in 10 minutes.`
      });

      logger.info('Phone verification OTP sent', { userId, phone: user.phone });

      res.status(200).json({
        success: true,
        message: 'Verification code sent to your phone'
      });
    } catch (error) {
      logger.error('Failed to send phone verification OTP:', error);
      throw new ValidationError('Failed to send verification code');
    }
  });

  /**
   * Get user groups
   */
  getUserGroups = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const { data: groupMemberships, error } = await supabase
      .from('group_members')
      .select(`
        group_id,
        role,
        joined_at,
        status,
        groups (
          id,
          name,
          description,
          type,
          is_active,
          member_count,
          created_at
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      logger.error('Failed to fetch user groups:', error);
      throw new ValidationError('Failed to fetch groups');
    }

    const groups = groupMemberships?.map(gm => ({
      id: gm.groups.id,
      name: gm.groups.name,
      description: gm.groups.description,
      type: gm.groups.type,
      isActive: gm.groups.is_active,
      memberCount: gm.groups.member_count,
      userRole: gm.role,
      joinedAt: gm.joined_at,
      createdAt: gm.groups.created_at
    })) || [];

    logger.info('User groups retrieved successfully', { userId, groupCount: groups.length });

    res.status(200).json({
      success: true,
      data: {
        groups
      },
      message: 'Groups retrieved successfully'
    });
  });

  /**
   * Delete user account
   */
  deleteAccount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { password } = req.body;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (!password) {
      throw new ValidationError('Password is required for account deletion');
    }

    // Get user's current password hash
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new NotFoundError('User not found');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new ValidationError('Invalid password');
    }

    // Soft delete - deactivate account
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .update({ 
        is_active: false,
        email: `deleted_${Date.now()}_${user.email}`, // Anonymize email
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (deleteError) {
      logger.error('Failed to delete user account:', deleteError);
      throw new ValidationError('Failed to delete account');
    }

    logger.info('User account deleted successfully', { userId });

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  });
}

export const userController = new UserController();
export default userController;
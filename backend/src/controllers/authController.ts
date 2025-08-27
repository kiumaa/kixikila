import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { supabase, supabaseAdmin } from '../services/supabase.ts';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth.ts';
import { 
  AuthenticationError, 
  ValidationError, 
  ConflictError, 
  NotFoundError,
  asyncHandler 
} from '../middleware/errorHandler.ts';
import { logger } from '../utils/logger.ts';
import { config } from '../config/index.ts';
import { otpService } from '../services/otpService.ts';
import { emailService } from '../services/emailService.ts';
import { smsService } from '../services/smsService.ts';

interface AuthResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      fullName: string;
      phone: string;
      role: string;
      isVip: boolean;
      emailVerified: boolean;
      phoneVerified: boolean;
      avatarUrl?: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: string;
    };
  };
  message: string;
}

class AuthController {
  /**
   * Register a new user
   */
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      email,
      password,
      fullName,
      phone,
      dateOfBirth,
      address,
      city,
      country,
    } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, phone')
      .or(`email.eq.${email},phone.eq.${phone}`)
      .single();

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictError('Email already registered');
      }
      if (existingUser.phone === phone) {
        throw new ConflictError('Phone number already registered');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.security.bcryptSaltRounds);

    // Create user
    const userId = uuidv4();
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email,
        full_name: fullName,
        phone,
        date_of_birth: dateOfBirth,
        address,
        city,
        country,
        role: 'user',
        is_vip: false,
        is_active: true,
        email_verified: false,
        phone_verified: false,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create user:', error);
      throw new Error('Failed to create user account');
    }

    // Store password hash in auth.users (Supabase Auth)
    const { error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName,
        phone,
        user_id: userId,
      },
      email_confirm: false, // We'll handle email verification manually
    });

    if (authError) {
      // Rollback user creation
      await supabaseAdmin.from('users').delete().eq('id', userId);
      logger.error('Failed to create auth user:', authError);
      throw new Error('Failed to create user authentication');
    }

    // Generate and send email verification OTP
    const emailOtp = await otpService.generateOtp(email, 'email_verification');
    await emailService.sendVerificationEmail(email, fullName, emailOtp);

    // Generate and send phone verification OTP
    const phoneOtp = await otpService.generateOtp(phone, 'phone_verification');
    await smsService.sendVerificationSms(phone, phoneOtp);

    logger.info('User registered successfully', {
      userId,
      email,
      phone,
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.full_name,
          phone: newUser.phone,
          role: newUser.role,
          isVip: newUser.is_vip,
          emailVerified: newUser.email_verified,
          phoneVerified: newUser.phone_verified,
        },
      },
      message: 'Registration successful. Please verify your email and phone number.',
    });
  });

  /**
   * User login
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password, rememberMe } = req.body;

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Verify password using Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Get user's group memberships
    const { data: groupMemberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const groupIds = groupMemberships?.map(gm => gm.group_id) || [];

    // Generate tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      isVip: user.is_vip,
      groupIds,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      rememberMe,
    });

    const response: AuthResponse = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          role: user.role,
          isVip: user.is_vip,
          emailVerified: user.email_verified,
          phoneVerified: user.phone_verified,
          avatarUrl: user.avatar_url,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: config.jwt.expiresIn,
        },
      },
      message: 'Login successful',
    };

    res.status(200).json(response);
  });

  /**
   * Verify OTP
   */
  verifyOtp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, otp, type } = req.body;

    // Verify OTP
    const isValid = await otpService.verifyOtp(email, otp, type);
    
    if (!isValid) {
      throw new AuthenticationError('Invalid or expired OTP');
    }

    // Update user verification status
    const updateData: any = {};
    
    if (type === 'email_verification') {
      updateData.email_verified = true;
    } else if (type === 'phone_verification') {
      updateData.phone_verified = true;
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('email', email);

      if (error) {
        logger.error('Failed to update user verification status:', error);
        throw new Error('Failed to update verification status');
      }
    }

    logger.info('OTP verified successfully', {
      email,
      type,
    });

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    });
  });

  /**
   * Resend OTP
   */
  resendOtp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, type } = req.body;

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('full_name, phone')
      .eq('email', email)
      .single();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate and send OTP
    if (type === 'email_verification' || type === 'password_reset') {
      const otp = await otpService.generateOtp(email, type);
      
      if (type === 'email_verification') {
        await emailService.sendVerificationEmail(email, user.full_name, otp);
      } else {
        await emailService.sendPasswordResetEmail(email, user.full_name, otp);
      }
    } else if (type === 'phone_verification') {
      const otp = await otpService.generateOtp(user.phone, type);
      await smsService.sendVerificationSms(user.phone, otp);
    }

    logger.info('OTP resent successfully', {
      email,
      type,
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
    });
  });

  /**
   * Forgot password
   */
  forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('full_name')
      .eq('email', email)
      .single();

    if (!user) {
      // Don't reveal if email exists or not
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset code has been sent.',
      });
      return;
    }

    // Generate and send password reset OTP
    const otp = await otpService.generateOtp(email, 'password_reset');
    await emailService.sendPasswordResetEmail(email, user.full_name, otp);

    logger.info('Password reset OTP sent', { email });

    res.status(200).json({
      success: true,
      message: 'If the email exists, a password reset code has been sent.',
    });
  });

  /**
   * Reset password
   */
  resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, otp, newPassword } = req.body;

    // Verify OTP
    const isValid = await otpService.verifyOtp(email, otp, 'password_reset');
    
    if (!isValid) {
      throw new AuthenticationError('Invalid or expired OTP');
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update password in Supabase Auth
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (error) {
      logger.error('Failed to update password:', error);
      throw new Error('Failed to update password');
    }

    logger.info('Password reset successfully', { email });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  });

  /**
   * Change password
   */
  changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: req.user!.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Update password
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      logger.error('Failed to change password:', error);
      throw new Error('Failed to change password');
    }

    logger.info('Password changed successfully', { userId });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  });

  /**
   * Refresh token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Get updated user data
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.id)
        .single();

      if (!user || !user.is_active) {
        throw new AuthenticationError('User not found or inactive');
      }

      // Get user's group memberships
      const { data: groupMemberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      const groupIds = groupMemberships?.map(gm => gm.group_id) || [];

      // Generate new tokens
      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        isVip: user.is_vip,
        groupIds,
      };

      const newAccessToken = generateToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      res.status(200).json({
        success: true,
        data: {
          tokens: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: config.jwt.expiresIn,
          },
        },
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      throw new AuthenticationError('Invalid refresh token');
    }
  });

  /**
   * Logout
   */
  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // In a stateless JWT system, logout is handled client-side
    // Here we could implement token blacklisting if needed
    
    if (req.user) {
      logger.info('User logged out', { userId: req.user.id });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  });

  /**
   * Get user profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          role: user.role,
          isVip: user.is_vip,
          emailVerified: user.email_verified,
          phoneVerified: user.phone_verified,
          avatarUrl: user.avatar_url,
          dateOfBirth: user.date_of_birth,
          address: user.address,
          city: user.city,
          country: user.country,
          createdAt: user.created_at,
          lastLogin: user.last_login,
        },
      },
    });
  });
}

export const authController = new AuthController();
export default authController;
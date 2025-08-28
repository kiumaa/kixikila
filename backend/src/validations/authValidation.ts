import Joi from 'joi';
import { commonValidations } from '../middleware/validation';

export const authValidation = {
  // User registration
  register: {
    body: Joi.object({
      email: commonValidations.email,
      password: commonValidations.password,
      fullName: commonValidations.name,
      phone: commonValidations.phone,
      dateOfBirth: commonValidations.optionalDate,
      address: Joi.string().trim().max(255).optional(),
      city: Joi.string().trim().max(100).optional(),
      country: Joi.string().trim().max(100).optional(),
      acceptTerms: Joi.boolean().valid(true).required().messages({
        'any.only': 'You must accept the terms and conditions',
      }),
      acceptPrivacy: Joi.boolean().valid(true).required().messages({
        'any.only': 'You must accept the privacy policy',
      }),
    }),
  },

  // User login
  login: {
    body: Joi.object({
      email: commonValidations.email,
      password: Joi.string().required(),
      rememberMe: commonValidations.optionalBoolean,
    }),
  },

  // OTP verification
  verifyOtp: {
    body: Joi.object({
      email: commonValidations.email,
      otp: commonValidations.otp,
      type: commonValidations.enum(['email_verification', 'phone_verification', 'password_reset']),
    }),
  },

  // Resend OTP
  resendOtp: {
    body: Joi.object({
      email: commonValidations.email,
      type: commonValidations.enum(['email_verification', 'phone_verification', 'password_reset']),
    }),
  },

  // Forgot password
  forgotPassword: {
    body: Joi.object({
      email: commonValidations.email,
    }),
  },

  // Reset password
  resetPassword: {
    body: Joi.object({
      email: commonValidations.email,
      otp: commonValidations.otp,
      newPassword: commonValidations.password,
      confirmPassword: Joi.string().required().valid(Joi.ref('newPassword')).messages({
        'any.only': 'Passwords do not match',
      }),
    }),
  },

  // Change password
  changePassword: {
    body: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: commonValidations.password,
      confirmPassword: Joi.string().required().valid(Joi.ref('newPassword')).messages({
        'any.only': 'Passwords do not match',
      }),
    }),
  },

  // Refresh token
  refreshToken: {
    body: Joi.object({
      refreshToken: Joi.string().required(),
    }),
  },

  // Update profile
  updateProfile: {
    body: Joi.object({
      fullName: commonValidations.optionalName,
      phone: commonValidations.optionalPhone,
      dateOfBirth: commonValidations.optionalDate,
      address: Joi.string().trim().max(255).optional().allow(''),
      city: Joi.string().trim().max(100).optional().allow(''),
      country: Joi.string().trim().max(100).optional().allow(''),
      avatarUrl: commonValidations.url,
    }).min(1), // At least one field must be provided
  },

  // Verify phone number
  verifyPhone: {
    body: Joi.object({
      phone: commonValidations.phone,
      otp: commonValidations.otp,
    }),
  },

  // Send phone verification
  sendPhoneVerification: {
    body: Joi.object({
      phone: commonValidations.phone,
    }),
  },

  // Delete account
  deleteAccount: {
    body: Joi.object({
      password: Joi.string().required(),
      confirmDeletion: Joi.boolean().valid(true).required().messages({
        'any.only': 'You must confirm account deletion',
      }),
    }),
  },

  // Two-factor authentication setup
  setupTwoFactor: {
    body: Joi.object({
      method: commonValidations.enum(['sms', 'email']),
      phone: Joi.when('method', {
        is: 'sms',
        then: commonValidations.phone,
        otherwise: Joi.forbidden(),
      }),
    }),
  },

  // Verify two-factor authentication
  verifyTwoFactor: {
    body: Joi.object({
      otp: commonValidations.otp,
      method: commonValidations.enum(['sms', 'email']),
    }),
  },

  // Disable two-factor authentication
  disableTwoFactor: {
    body: Joi.object({
      password: Joi.string().required(),
      otp: commonValidations.otp,
    }),
  },
};

export default authValidation;
import Joi from 'joi';
import { commonValidations } from '../middleware/validation';

export const userValidation = {
  /**
   * Validation for updating user profile
   */
  updateProfile: {
    body: Joi.object({
      fullName: Joi.string()
        .min(2)
        .max(100)
        .trim()
        .optional()
        .messages({
          'string.min': 'Full name must be at least 2 characters long',
          'string.max': 'Full name cannot exceed 100 characters'
        }),
      
      phone: commonValidations.phone.optional(),
      
      dateOfBirth: Joi.date()
        .max('now')
        .iso()
        .optional()
        .messages({
          'date.max': 'Date of birth cannot be in the future'
        }),
      
      address: Joi.string()
        .max(255)
        .trim()
        .optional()
        .messages({
          'string.max': 'Address cannot exceed 255 characters'
        }),
      
      city: Joi.string()
        .max(100)
        .trim()
        .optional()
        .messages({
          'string.max': 'City cannot exceed 100 characters'
        }),
      
      country: Joi.string()
        .max(100)
        .trim()
        .optional()
        .messages({
          'string.max': 'Country cannot exceed 100 characters'
        }),
      
      avatarUrl: Joi.string()
        .uri()
        .optional()
        .messages({
          'string.uri': 'Avatar URL must be a valid URL'
        })
    }).min(1).messages({
      'object.min': 'At least one field must be provided for update'
    })
  },

  /**
   * Validation for phone verification
   */
  verifyPhone: {
    body: Joi.object({
      otp: Joi.string()
        .length(6)
        .pattern(/^[0-9]+$/)
        .required()
        .messages({
          'string.length': 'OTP must be exactly 6 digits',
          'string.pattern.base': 'OTP must contain only numbers',
          'any.required': 'OTP is required'
        })
    })
  },

  /**
   * Validation for account deletion
   */
  deleteAccount: {
    body: Joi.object({
      password: Joi.string()
        .min(1)
        .required()
        .messages({
          'any.required': 'Password is required for account deletion',
          'string.min': 'Password cannot be empty'
        })
    })
  },

  /**
   * Validation for user search/filtering (admin)
   */
  searchUsers: {
    query: Joi.object({
      search: Joi.string()
        .max(100)
        .trim()
        .optional()
        .messages({
          'string.max': 'Search term cannot exceed 100 characters'
        }),
      
      role: Joi.string()
        .valid('user', 'admin', 'moderator')
        .optional()
        .messages({
          'any.only': 'Role must be one of: user, admin, moderator'
        }),
      
      isVip: Joi.boolean()
        .optional(),
      
      isActive: Joi.boolean()
        .optional(),
      
      emailVerified: Joi.boolean()
        .optional(),
      
      phoneVerified: Joi.boolean()
        .optional(),
      
      page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .optional()
        .messages({
          'number.min': 'Page must be at least 1'
        }),
      
      limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20)
        .optional()
        .messages({
          'number.min': 'Limit must be at least 1',
          'number.max': 'Limit cannot exceed 100'
        }),
      
      sortBy: Joi.string()
        .valid('created_at', 'updated_at', 'full_name', 'email')
        .default('created_at')
        .optional()
        .messages({
          'any.only': 'Sort by must be one of: created_at, updated_at, full_name, email'
        }),
      
      sortOrder: Joi.string()
        .valid('asc', 'desc')
        .default('desc')
        .optional()
        .messages({
          'any.only': 'Sort order must be either asc or desc'
        })
    })
  },

  /**
   * Validation for updating user status (admin)
   */
  updateUserStatus: {
    params: Joi.object({
      userId: commonValidations.uuid.required()
    }),
    
    body: Joi.object({
      isActive: Joi.boolean()
        .optional(),
      
      role: Joi.string()
        .valid('user', 'admin', 'moderator')
        .optional()
        .messages({
          'any.only': 'Role must be one of: user, admin, moderator'
        }),
      
      isVip: Joi.boolean()
        .optional(),
      
      reason: Joi.string()
        .max(500)
        .trim()
        .optional()
        .messages({
          'string.max': 'Reason cannot exceed 500 characters'
        })
    }).min(1).messages({
      'object.min': 'At least one field must be provided for update'
    })
  },

  /**
   * Validation for user ID parameter
   */
  userIdParam: {
    params: Joi.object({
      userId: commonValidations.uuid.required()
    })
  }
};
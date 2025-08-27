import Joi from 'joi';
import { commonValidations } from '../middleware/validation';

export const groupValidation = {
  /**
   * Validation for creating a new group
   */
  createGroup: {
    body: Joi.object({
      name: Joi.string()
        .min(2)
        .max(100)
        .trim()
        .required()
        .messages({
          'string.min': 'Group name must be at least 2 characters long',
          'string.max': 'Group name cannot exceed 100 characters',
          'any.required': 'Group name is required'
        }),
      
      description: Joi.string()
        .max(500)
        .trim()
        .optional()
        .allow('')
        .messages({
          'string.max': 'Description cannot exceed 500 characters'
        }),
      
      type: Joi.string()
        .valid('family', 'friends', 'work', 'travel', 'other')
        .required()
        .messages({
          'any.only': 'Group type must be one of: family, friends, work, travel, other',
          'any.required': 'Group type is required'
        }),
      
      currency: Joi.string()
        .valid('AOA', 'USD', 'EUR', 'GBP', 'ZAR')
        .default('AOA')
        .optional()
        .messages({
          'any.only': 'Currency must be one of: AOA, USD, EUR, GBP, ZAR'
        })
    })
  },

  /**
   * Validation for updating group details
   */
  updateGroup: {
    params: Joi.object({
      id: commonValidations.uuid.required()
    }),
    
    body: Joi.object({
      name: Joi.string()
        .min(2)
        .max(100)
        .trim()
        .optional()
        .messages({
          'string.min': 'Group name must be at least 2 characters long',
          'string.max': 'Group name cannot exceed 100 characters'
        }),
      
      description: Joi.string()
        .max(500)
        .trim()
        .optional()
        .allow('')
        .messages({
          'string.max': 'Description cannot exceed 500 characters'
        }),
      
      currency: Joi.string()
        .valid('AOA', 'USD', 'EUR', 'GBP', 'ZAR')
        .optional()
        .messages({
          'any.only': 'Currency must be one of: AOA, USD, EUR, GBP, ZAR'
        })
    }).min(1).messages({
      'object.min': 'At least one field must be provided for update'
    })
  },

  /**
   * Validation for group ID parameter
   */
  groupIdParam: {
    params: Joi.object({
      id: commonValidations.uuid.required()
    })
  },

  /**
   * Validation for adding member to group
   */
  addMember: {
    params: Joi.object({
      id: commonValidations.uuid.required()
    }),
    
    body: Joi.object({
      email: commonValidations.email.required(),
      
      role: Joi.string()
        .valid('admin', 'member')
        .default('member')
        .optional()
        .messages({
          'any.only': 'Role must be either admin or member'
        })
    })
  },

  /**
   * Validation for removing member from group
   */
  removeMember: {
    params: Joi.object({
      id: commonValidations.uuid.required(),
      memberId: commonValidations.uuid.required()
    })
  },

  /**
   * Validation for group search/filtering
   */
  searchGroups: {
    query: Joi.object({
      search: Joi.string()
        .max(100)
        .trim()
        .optional()
        .messages({
          'string.max': 'Search term cannot exceed 100 characters'
        }),
      
      type: Joi.string()
        .valid('family', 'friends', 'work', 'travel', 'other')
        .optional()
        .messages({
          'any.only': 'Group type must be one of: family, friends, work, travel, other'
        }),
      
      currency: Joi.string()
        .valid('AOA', 'USD', 'EUR', 'GBP', 'ZAR')
        .optional()
        .messages({
          'any.only': 'Currency must be one of: AOA, USD, EUR, GBP, ZAR'
        }),
      
      isActive: Joi.boolean()
        .optional(),
      
      role: Joi.string()
        .valid('admin', 'member')
        .optional()
        .messages({
          'any.only': 'Role must be either admin or member'
        }),
      
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
        .max(50)
        .default(20)
        .optional()
        .messages({
          'number.min': 'Limit must be at least 1',
          'number.max': 'Limit cannot exceed 50'
        }),
      
      sortBy: Joi.string()
        .valid('created_at', 'updated_at', 'name', 'member_count', 'total_balance')
        .default('created_at')
        .optional()
        .messages({
          'any.only': 'Sort by must be one of: created_at, updated_at, name, member_count, total_balance'
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
   * Validation for updating member role
   */
  updateMemberRole: {
    params: Joi.object({
      id: commonValidations.uuid.required(),
      memberId: commonValidations.uuid.required()
    }),
    
    body: Joi.object({
      role: Joi.string()
        .valid('admin', 'member')
        .required()
        .messages({
          'any.only': 'Role must be either admin or member',
          'any.required': 'Role is required'
        })
    })
  },

  /**
   * Validation for group invitation
   */
  inviteToGroup: {
    params: Joi.object({
      id: commonValidations.uuid.required()
    }),
    
    body: Joi.object({
      emails: Joi.array()
        .items(commonValidations.email)
        .min(1)
        .max(10)
        .required()
        .messages({
          'array.min': 'At least one email is required',
          'array.max': 'Cannot invite more than 10 users at once',
          'any.required': 'Email list is required'
        }),
      
      role: Joi.string()
        .valid('admin', 'member')
        .default('member')
        .optional()
        .messages({
          'any.only': 'Role must be either admin or member'
        }),
      
      message: Joi.string()
        .max(500)
        .trim()
        .optional()
        .allow('')
        .messages({
          'string.max': 'Invitation message cannot exceed 500 characters'
        })
    })
  },

  /**
   * Validation for group statistics query
   */
  groupStats: {
    params: Joi.object({
      id: commonValidations.uuid.required()
    }),
    
    query: Joi.object({
      period: Joi.string()
        .valid('week', 'month', 'quarter', 'year', 'all')
        .default('month')
        .optional()
        .messages({
          'any.only': 'Period must be one of: week, month, quarter, year, all'
        }),
      
      startDate: Joi.date()
        .iso()
        .optional()
        .messages({
          'date.format': 'Start date must be in ISO format'
        }),
      
      endDate: Joi.date()
        .iso()
        .min(Joi.ref('startDate'))
        .optional()
        .messages({
          'date.format': 'End date must be in ISO format',
          'date.min': 'End date must be after start date'
        })
    })
  }
};
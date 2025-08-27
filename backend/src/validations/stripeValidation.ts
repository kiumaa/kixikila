import Joi from 'joi';
import { commonValidations } from '../middleware/validation';

export const stripeValidation = {
  // Create customer validation
  createCustomer: {
    body: Joi.object({
      // No additional fields needed - user info comes from auth middleware
    })
  },

  // Create subscription validation
  createSubscription: {
    body: Joi.object({
      priceId: Joi.string()
        .required()
        .pattern(/^price_[a-zA-Z0-9]+$/)
        .messages({
          'string.pattern.base': 'Invalid Stripe price ID format',
          'any.required': 'Price ID is required'
        })
    })
  },

  // Subscription ID parameter validation
  subscriptionId: {
    params: Joi.object({
      subscriptionId: Joi.string()
        .required()
        .pattern(/^sub_[a-zA-Z0-9]+$/)
        .messages({
          'string.pattern.base': 'Invalid Stripe subscription ID format',
          'any.required': 'Subscription ID is required'
        })
    })
  },

  // Payment Intent ID parameter validation
  paymentIntentId: {
    params: Joi.object({
      paymentIntentId: Joi.string()
        .required()
        .pattern(/^pi_[a-zA-Z0-9]+$/)
        .messages({
          'string.pattern.base': 'Invalid Stripe payment intent ID format',
          'any.required': 'Payment intent ID is required'
        })
    })
  },

  // Create payment intent validation
  createPaymentIntent: {
    body: Joi.object({
      amount: Joi.number()
        .integer()
        .min(50) // Minimum 50 cents
        .max(99999999) // Maximum $999,999.99
        .required()
        .messages({
          'number.min': 'Amount must be at least 50 cents',
          'number.max': 'Amount cannot exceed $999,999.99',
          'any.required': 'Amount is required'
        }),
      
      currency: Joi.string()
        .length(3)
        .lowercase()
        .valid('usd', 'eur', 'gbp', 'cad', 'aud', 'jpy', 'chf', 'sek', 'nok', 'dkk')
        .default('usd')
        .messages({
          'string.length': 'Currency must be a 3-letter ISO code',
          'any.only': 'Unsupported currency'
        }),
      
      description: Joi.string()
        .max(500)
        .optional()
        .messages({
          'string.max': 'Description cannot exceed 500 characters'
        }),
      
      metadata: Joi.object()
        .pattern(Joi.string(), Joi.string().max(500))
        .max(50) // Maximum 50 metadata keys
        .optional()
        .messages({
          'object.max': 'Cannot have more than 50 metadata entries',
          'string.max': 'Metadata values cannot exceed 500 characters'
        })
    })
  },

  // Setup intent validation
  createSetupIntent: {
    body: Joi.object({
      // No additional fields needed - customer info comes from auth middleware
    })
  },

  // Webhook validation
  webhook: {
    headers: Joi.object({
      'stripe-signature': Joi.string()
        .required()
        .messages({
          'any.required': 'Stripe signature is required'
        })
    }).unknown(true) // Allow other headers
  },

  // Query parameters for listing subscriptions
  listSubscriptions: {
    query: Joi.object({
      status: Joi.string()
        .valid('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid')
        .optional()
        .messages({
          'any.only': 'Invalid subscription status'
        }),
      
      limit: commonValidations.limit,
      offset: Joi.number().integer().min(0).default(0)
    })
  },

  // Query parameters for listing payment methods
  listPaymentMethods: {
    query: Joi.object({
      type: Joi.string()
        .valid('card', 'bank_account', 'sepa_debit', 'ideal', 'sofort')
        .optional()
        .messages({
          'any.only': 'Invalid payment method type'
        }),
      
      limit: commonValidations.limit
    })
  },

  // Price ID validation for plans
  priceId: {
    params: Joi.object({
      priceId: Joi.string()
        .required()
        .pattern(/^price_[a-zA-Z0-9]+$/)
        .messages({
          'string.pattern.base': 'Invalid Stripe price ID format',
          'any.required': 'Price ID is required'
        })
    })
  },

  // Customer ID validation
  customerId: {
    params: Joi.object({
      customerId: Joi.string()
        .required()
        .pattern(/^cus_[a-zA-Z0-9]+$/)
        .messages({
          'string.pattern.base': 'Invalid Stripe customer ID format',
          'any.required': 'Customer ID is required'
        })
    })
  },

  // Update subscription validation
  updateSubscription: {
    body: Joi.object({
      priceId: Joi.string()
        .pattern(/^price_[a-zA-Z0-9]+$/)
        .optional()
        .messages({
          'string.pattern.base': 'Invalid Stripe price ID format'
        }),
      
      quantity: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .optional()
        .messages({
          'number.min': 'Quantity must be at least 1',
          'number.max': 'Quantity cannot exceed 100'
        }),
      
      prorationBehavior: Joi.string()
        .valid('create_prorations', 'none', 'always_invoice')
        .default('create_prorations')
        .optional()
        .messages({
          'any.only': 'Invalid proration behavior'
        })
    })
  },

  // Cancel subscription validation
  cancelSubscription: {
    body: Joi.object({
      cancelAtPeriodEnd: Joi.boolean()
        .default(true)
        .optional(),
      
      cancellationReason: Joi.string()
        .max(500)
        .optional()
        .messages({
          'string.max': 'Cancellation reason cannot exceed 500 characters'
        })
    })
  }
};

export default stripeValidation;
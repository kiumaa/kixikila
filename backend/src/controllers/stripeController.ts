import { Request, Response } from 'express';
import { stripeService } from '../services/stripeService';
import { supabase } from '../services/supabase';
import { logger } from '../utils/logger';
import { 
  ValidationError, 
  NotFoundError, 
  InternalServerError,
  ConflictError 
} from '../middleware/errorHandler';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
  };
}

class StripeController {
  /**
   * Create or get Stripe customer
   */
  async createCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        throw new ValidationError('User information not found');
      }

      const customerId = await stripeService.getOrCreateCustomer({
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber
      });

      if (!customerId) {
        throw new InternalServerError('Failed to create Stripe customer');
      }

      res.status(200).json({
        success: true,
        data: {
          customerId
        }
      });
    } catch (error) {
      logger.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Get customer information
   */
  async getCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        throw new ValidationError('User information not found');
      }

      // Get user's Stripe customer ID
      const { data: userData } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

      if (!userData?.stripe_customer_id) {
        throw new NotFoundError('Stripe customer not found');
      }

      res.status(200).json({
        success: true,
        data: {
          customerId: userData.stripe_customer_id
        }
      });
    } catch (error) {
      logger.error('Error getting Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Get user subscriptions
   */
  async getSubscriptions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        throw new ValidationError('User information not found');
      }

      // Get user's Stripe customer ID
      const { data: userData } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

      if (!userData?.stripe_customer_id) {
        res.status(200).json({
          success: true,
          data: {
            subscriptions: []
          }
        });
        return;
      }

      const subscriptions = await stripeService.getCustomerSubscriptions(userData.stripe_customer_id);

      res.status(200).json({
        success: true,
        data: {
          subscriptions
        }
      });
    } catch (error) {
      logger.error('Error getting subscriptions:', error);
      throw error;
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      const { priceId } = req.body;

      if (!user) {
        throw new ValidationError('User information not found');
      }

      // Get or create customer
      const customerId = await stripeService.getOrCreateCustomer({
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber
      });

      if (!customerId) {
        throw new InternalServerError('Failed to create Stripe customer');
      }

      // Check if user already has an active subscription
      const existingSubscriptions = await stripeService.getCustomerSubscriptions(customerId);
      const activeSubscription = existingSubscriptions.find(
        sub => sub.status === 'active' || sub.status === 'trialing'
      );

      if (activeSubscription) {
        throw new ConflictError('User already has an active subscription');
      }

      const subscription = await stripeService.createSubscription({
        customerId,
        priceId,
        userId: user.id
      });

      if (!subscription) {
        throw new InternalServerError('Failed to create subscription');
      }

      res.status(201).json({
        success: true,
        data: {
          subscription
        }
      });
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription (at period end)
   */
  async cancelSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { subscriptionId } = req.params;
      const { user } = req;

      if (!user) {
        throw new ValidationError('User information not found');
      }

      // Verify subscription belongs to user
      const subscription = await stripeService.getSubscription(subscriptionId);
      if (!subscription) {
        throw new NotFoundError('Subscription not found');
      }

      const success = await stripeService.cancelSubscription(subscriptionId);
      if (!success) {
        throw new InternalServerError('Failed to cancel subscription');
      }

      res.status(200).json({
        success: true,
        message: 'Subscription will be canceled at the end of the current period'
      });
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription immediately
   */
  async cancelSubscriptionImmediately(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { subscriptionId } = req.params;
      const { user } = req;

      if (!user) {
        throw new ValidationError('User information not found');
      }

      // Verify subscription belongs to user
      const subscription = await stripeService.getSubscription(subscriptionId);
      if (!subscription) {
        throw new NotFoundError('Subscription not found');
      }

      const success = await stripeService.cancelSubscriptionImmediately(subscriptionId);
      if (!success) {
        throw new InternalServerError('Failed to cancel subscription');
      }

      res.status(200).json({
        success: true,
        message: 'Subscription canceled immediately'
      });
    } catch (error) {
      logger.error('Error canceling subscription immediately:', error);
      throw error;
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { subscriptionId } = req.params;
      const { user } = req;

      if (!user) {
        throw new ValidationError('User information not found');
      }

      // Verify subscription belongs to user
      const subscription = await stripeService.getSubscription(subscriptionId);
      if (!subscription) {
        throw new NotFoundError('Subscription not found');
      }

      const success = await stripeService.reactivateSubscription(subscriptionId);
      if (!success) {
        throw new InternalServerError('Failed to reactivate subscription');
      }

      res.status(200).json({
        success: true,
        message: 'Subscription reactivated successfully'
      });
    } catch (error) {
      logger.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        throw new ValidationError('User information not found');
      }

      // Get user's Stripe customer ID
      const { data: userData } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

      if (!userData?.stripe_customer_id) {
        res.status(200).json({
          success: true,
          data: {
            paymentMethods: []
          }
        });
        return;
      }

      const paymentMethods = await stripeService.getCustomerPaymentMethods(userData.stripe_customer_id);

      res.status(200).json({
        success: true,
        data: {
          paymentMethods
        }
      });
    } catch (error) {
      logger.error('Error getting payment methods:', error);
      throw error;
    }
  }

  /**
   * Create setup intent for adding payment method
   */
  async createSetupIntent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        throw new ValidationError('User information not found');
      }

      // Get or create customer
      const customerId = await stripeService.getOrCreateCustomer({
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber
      });

      if (!customerId) {
        throw new InternalServerError('Failed to create Stripe customer');
      }

      const setupIntent = await stripeService.createSetupIntent(customerId);
      if (!setupIntent) {
        throw new InternalServerError('Failed to create setup intent');
      }

      res.status(201).json({
        success: true,
        data: {
          clientSecret: setupIntent.client_secret
        }
      });
    } catch (error) {
      logger.error('Error creating setup intent:', error);
      throw error;
    }
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      const { amount, currency, description, metadata } = req.body;

      if (!user) {
        throw new ValidationError('User information not found');
      }

      // Get or create customer
      const customerId = await stripeService.getOrCreateCustomer({
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber
      });

      if (!customerId) {
        throw new InternalServerError('Failed to create Stripe customer');
      }

      const paymentIntent = await stripeService.createPaymentIntent({
        amount,
        currency: currency || 'usd',
        customerId,
        description,
        metadata
      });

      if (!paymentIntent) {
        throw new InternalServerError('Failed to create payment intent');
      }

      res.status(201).json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
        }
      });
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { paymentIntentId } = req.params;
      const { user } = req;

      if (!user) {
        throw new ValidationError('User information not found');
      }

      const paymentIntent = await stripeService.confirmPaymentIntent(paymentIntentId);
      if (!paymentIntent) {
        throw new InternalServerError('Failed to confirm payment intent');
      }

      res.status(200).json({
        success: true,
        data: {
          paymentIntent
        }
      });
    } catch (error) {
      logger.error('Error confirming payment intent:', error);
      throw error;
    }
  }

  /**
   * Get available plans
   */
  async getAvailablePlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = await stripeService.getAvailablePlans();

      res.status(200).json({
        success: true,
        data: {
          plans
        }
      });
    } catch (error) {
      logger.error('Error getting available plans:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhooks
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const body = req.body;

      if (!signature) {
        throw new ValidationError('Missing Stripe signature');
      }

      const success = await stripeService.handleWebhook(body, signature);
      if (!success) {
        throw new InternalServerError('Failed to process webhook');
      }

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('Error handling Stripe webhook:', error);
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  }
}

export const stripeController = new StripeController();
export default stripeController;
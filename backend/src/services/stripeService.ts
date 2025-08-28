import Stripe from 'stripe';
import { config } from '../config/index.js';
import { logger } from '../utils/logger';
import { supabase } from './supabase';
import { notificationService } from './notificationService';

interface CreateCustomerData {
  userId: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
}

interface CreateSubscriptionData {
  customerId: string;
  priceId: string;
  userId: string;
}

interface CreatePaymentIntentData {
  amount: number;
  currency: string;
  customerId: string;
  description: string;
  metadata?: Record<string, string>;
}

class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
  }

  /**
   * Create Stripe customer
   */
  async createCustomer(data: CreateCustomerData): Promise<Stripe.Customer | null> {
    try {
      const customer = await this.stripe.customers.create({
        email: data.email,
        name: data.fullName,
        phone: data.phoneNumber,
        metadata: {
          userId: data.userId,
          source: 'kixikila_app'
        }
      });

      // Update user with Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('id', data.userId);

      logger.info('Stripe customer created', {
        customerId: customer.id,
        userId: data.userId,
        email: data.email
      });

      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer:', error);
      return null;
    }
  }

  /**
   * Get or create customer
   */
  async getOrCreateCustomer(data: CreateCustomerData): Promise<string | null> {
    try {
      // Check if user already has a Stripe customer ID
      const { data: user } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', data.userId)
        .single();

      if (user?.stripe_customer_id) {
        // Verify customer exists in Stripe
        try {
          await this.stripe.customers.retrieve(user.stripe_customer_id);
          return user.stripe_customer_id;
        } catch (error) {
          // Customer doesn't exist in Stripe, create new one
          logger.warn('Stripe customer not found, creating new one', {
            oldCustomerId: user.stripe_customer_id,
            userId: data.userId
          });
        }
      }

      // Create new customer
      const customer = await this.createCustomer(data);
      return customer?.id || null;
    } catch (error) {
      logger.error('Failed to get or create customer:', error);
      return null;
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(data: CreateSubscriptionData): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: data.customerId,
        items: [{ price: data.priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: data.userId,
          source: 'kixikila_app'
        }
      });

      logger.info('Stripe subscription created', {
        subscriptionId: subscription.id,
        customerId: data.customerId,
        userId: data.userId,
        status: subscription.status
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to create subscription:', error);
      return null;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });

      logger.info('Stripe subscription cancelled', {
        subscriptionId: subscription.id,
        cancelAt: subscription.cancel_at
      });

      return true;
    } catch (error) {
      logger.error('Failed to cancel subscription:', error);
      return false;
    }
  }

  /**
   * Immediately cancel subscription
   */
  async cancelSubscriptionImmediately(subscriptionId: string): Promise<boolean> {
    try {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId);

      logger.info('Stripe subscription cancelled immediately', {
        subscriptionId: subscription.id,
        status: subscription.status
      });

      return true;
    } catch (error) {
      logger.error('Failed to cancel subscription immediately:', error);
      return false;
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false
      });

      logger.info('Stripe subscription reactivated', {
        subscriptionId: subscription.id
      });

      return true;
    } catch (error) {
      logger.error('Failed to reactivate subscription:', error);
      return false;
    }
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(data: CreatePaymentIntentData): Promise<Stripe.PaymentIntent | null> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency.toLowerCase(),
        customer: data.customerId,
        description: data.description,
        metadata: data.metadata || {},
        automatic_payment_methods: {
          enabled: true
        }
      });

      logger.info('Payment intent created', {
        paymentIntentId: paymentIntent.id,
        amount: data.amount,
        currency: data.currency,
        customerId: data.customerId
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Failed to create payment intent:', error);
      return null;
    }
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);

      logger.info('Payment intent confirmed', {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Failed to confirm payment intent:', error);
      return null;
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice', 'customer']
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to get subscription:', error);
      return null;
    }
  }

  /**
   * Get customer subscriptions
   */
  async getCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        expand: ['data.latest_invoice']
      });

      return subscriptions.data;
    } catch (error) {
      logger.error('Failed to get customer subscriptions:', error);
      return [];
    }
  }

  /**
   * Get payment methods for customer
   */
  async getCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return paymentMethods.data;
    } catch (error) {
      logger.error('Failed to get customer payment methods:', error);
      return [];
    }
  }

  /**
   * Create setup intent for saving payment method
   */
  async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent | null> {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session'
      });

      logger.info('Setup intent created', {
        setupIntentId: setupIntent.id,
        customerId
      });

      return setupIntent;
    } catch (error) {
      logger.error('Failed to create setup intent:', error);
      return null;
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(body: string, signature: string): Promise<boolean> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        config.stripe.webhookSecret
      );

      logger.info('Stripe webhook received', {
        type: event.type,
        id: event.id
      });

      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        default:
          logger.info('Unhandled webhook event type', { type: event.type });
      }

      return true;
    } catch (error) {
      logger.error('Webhook handling failed:', error);
      return false;
    }
  }

  /**
   * Handle subscription created
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    try {
      const userId = subscription.metadata.userId;
      if (!userId) return;

      // Update user subscription status
      await supabase
        .from('users')
        .update({
          subscription_status: subscription.status,
          subscription_id: subscription.id,
          subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
        })
        .eq('id', userId);

      // Send notification
      if (subscription.status === 'active') {
        const price = subscription.items.data[0]?.price;
        const planName = price?.nickname || 'VIP';
        const expiryDate = new Date(subscription.current_period_end * 1000);

        await notificationService.sendVIPSubscription(userId, planName, expiryDate);
      }

      logger.info('Subscription created handled', {
        subscriptionId: subscription.id,
        userId,
        status: subscription.status
      });
    } catch (error) {
      logger.error('Failed to handle subscription created:', error);
    }
  }

  /**
   * Handle subscription updated
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    try {
      const userId = subscription.metadata.userId;
      if (!userId) return;

      // Update user subscription status
      await supabase
        .from('users')
        .update({
          subscription_status: subscription.status,
          subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
        })
        .eq('id', userId);

      logger.info('Subscription updated handled', {
        subscriptionId: subscription.id,
        userId,
        status: subscription.status
      });
    } catch (error) {
      logger.error('Failed to handle subscription updated:', error);
    }
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      const userId = subscription.metadata.userId;
      if (!userId) return;

      // Update user subscription status
      await supabase
        .from('users')
        .update({
          subscription_status: 'canceled',
          subscription_id: null,
          subscription_current_period_end: null
        })
        .eq('id', userId);

      // Send notification
      await notificationService.sendNotification({
        userId,
        type: 'subscription_expired',
        title: 'Assinatura Cancelada',
        message: 'Sua assinatura VIP foi cancelada. Você ainda pode usar os recursos básicos do app.',
        priority: 'medium'
      });

      logger.info('Subscription deleted handled', {
        subscriptionId: subscription.id,
        userId
      });
    } catch (error) {
      logger.error('Failed to handle subscription deleted:', error);
    }
  }

  /**
   * Handle payment succeeded
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    try {
      const customerId = invoice.customer as string;
      const subscriptionId = invoice.subscription as string;

      if (subscriptionId) {
        const subscription = await this.getSubscription(subscriptionId);
        if (subscription?.metadata.userId) {
          await notificationService.sendNotification({
            userId: subscription.metadata.userId,
            type: 'payment_received',
            title: 'Pagamento Confirmado',
            message: `Seu pagamento de ${(invoice.amount_paid / 100).toFixed(2)} AOA foi processado com sucesso.`,
            data: {
              amount: invoice.amount_paid / 100,
              currency: invoice.currency,
              invoiceId: invoice.id
            },
            priority: 'medium'
          });
        }
      }

      logger.info('Payment succeeded handled', {
        invoiceId: invoice.id,
        customerId,
        amount: invoice.amount_paid / 100
      });
    } catch (error) {
      logger.error('Failed to handle payment succeeded:', error);
    }
  }

  /**
   * Handle payment failed
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    try {
      const subscriptionId = invoice.subscription as string;

      if (subscriptionId) {
        const subscription = await this.getSubscription(subscriptionId);
        if (subscription?.metadata.userId) {
          await notificationService.sendNotification({
            userId: subscription.metadata.userId,
            type: 'payment_failed',
            title: 'Falha no Pagamento',
            message: `Não foi possível processar seu pagamento de ${(invoice.amount_due / 100).toFixed(2)} AOA. Verifique seu método de pagamento.`,
            data: {
              amount: invoice.amount_due / 100,
              currency: invoice.currency,
              invoiceId: invoice.id
            },
            priority: 'high'
          });
        }
      }

      logger.info('Payment failed handled', {
        invoiceId: invoice.id,
        amount: invoice.amount_due / 100
      });
    } catch (error) {
      logger.error('Failed to handle payment failed:', error);
    }
  }

  /**
   * Handle payment intent succeeded
   */
  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      logger.info('Payment intent succeeded', {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      });

      // Handle one-time payments here if needed
    } catch (error) {
      logger.error('Failed to handle payment intent succeeded:', error);
    }
  }

  /**
   * Handle payment intent failed
   */
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      logger.info('Payment intent failed', {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        lastPaymentError: paymentIntent.last_payment_error
      });

      // Handle failed one-time payments here if needed
    } catch (error) {
      logger.error('Failed to handle payment intent failed:', error);
    }
  }

  /**
   * Get available prices/plans
   */
  async getAvailablePlans(): Promise<Stripe.Price[]> {
    try {
      const prices = await this.stripe.prices.list({
        active: true,
        expand: ['data.product'],
        limit: 100
      });

      return prices.data.filter(price => 
        price.product && 
        typeof price.product === 'object' && 
        price.product.active
      );
    } catch (error) {
      logger.error('Failed to get available plans:', error);
      return [];
    }
  }
}

export const stripeService = new StripeService();
export default stripeService;
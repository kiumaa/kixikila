import { Router } from 'express';
import { stripeController } from '../controllers/stripeController';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { stripeValidation } from '../validations/stripeValidation';
import { financialRateLimit, apiRateLimit } from '../middleware/rateLimiting';
import { auditFinancialOperation } from '../middleware/auditLogger';

const router = Router();

// Public routes (webhooks and plans)
router.post('/webhook', stripeController.handleWebhook);
router.get('/plans', apiRateLimit, stripeController.getAvailablePlans);

// Protected routes
router.use(authMiddleware);

// Customer management
router.post('/customer', 
  financialRateLimit,
  auditFinancialOperation,
  validateRequest(stripeValidation.createCustomer),
  stripeController.createCustomer
);

router.get('/customer', apiRateLimit, stripeController.getCustomer);

// Subscription management
router.get('/subscriptions', apiRateLimit, stripeController.getSubscriptions);

router.post('/subscriptions',
  financialRateLimit,
  auditFinancialOperation,
  validateRequest(stripeValidation.createSubscription),
  stripeController.createSubscription
);

router.patch('/subscriptions/:subscriptionId/cancel',
  financialRateLimit,
  auditFinancialOperation,
  validateRequest(stripeValidation.subscriptionId),
  stripeController.cancelSubscription
);

router.patch('/subscriptions/:subscriptionId/reactivate',
  financialRateLimit,
  auditFinancialOperation,
  validateRequest(stripeValidation.subscriptionId),
  stripeController.reactivateSubscription
);

router.delete('/subscriptions/:subscriptionId',
  financialRateLimit,
  auditFinancialOperation,
  validateRequest(stripeValidation.subscriptionId),
  stripeController.cancelSubscriptionImmediately
);

// Payment methods
router.get('/payment-methods', apiRateLimit, stripeController.getPaymentMethods);

router.post('/setup-intent', financialRateLimit, stripeController.createSetupIntent);

// Payment intents
router.post('/payment-intent',
  financialRateLimit,
  auditFinancialOperation,
  validateRequest(stripeValidation.createPaymentIntent),
  stripeController.createPaymentIntent
);

router.patch('/payment-intent/:paymentIntentId/confirm',
  financialRateLimit,
  auditFinancialOperation,
  validateRequest(stripeValidation.paymentIntentId),
  stripeController.confirmPaymentIntent
);

// Plans and pricing moved to public routes above

export default router;
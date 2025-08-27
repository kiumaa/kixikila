import { Router } from 'express';
import { stripeController } from '../controllers/stripeController.ts';
import { authMiddleware } from '../middleware/auth.ts';
import { validateRequest } from '../middleware/validation.ts';
import { stripeValidation } from '../validations/stripeValidation.ts';

const router = Router();

// Public routes (webhooks and plans)
router.post('/webhook', stripeController.handleWebhook);
router.get('/plans', stripeController.getAvailablePlans);

// Protected routes
router.use(authMiddleware);

// Customer management
router.post('/customer', 
  validateRequest(stripeValidation.createCustomer),
  stripeController.createCustomer
);

router.get('/customer', stripeController.getCustomer);

// Subscription management
router.get('/subscriptions', stripeController.getSubscriptions);

router.post('/subscriptions',
  validateRequest(stripeValidation.createSubscription),
  stripeController.createSubscription
);

router.patch('/subscriptions/:subscriptionId/cancel',
  validateRequest(stripeValidation.subscriptionId),
  stripeController.cancelSubscription
);

router.patch('/subscriptions/:subscriptionId/reactivate',
  validateRequest(stripeValidation.subscriptionId),
  stripeController.reactivateSubscription
);

router.delete('/subscriptions/:subscriptionId',
  validateRequest(stripeValidation.subscriptionId),
  stripeController.cancelSubscriptionImmediately
);

// Payment methods
router.get('/payment-methods', stripeController.getPaymentMethods);

router.post('/setup-intent', stripeController.createSetupIntent);

// Payment intents
router.post('/payment-intent',
  validateRequest(stripeValidation.createPaymentIntent),
  stripeController.createPaymentIntent
);

router.patch('/payment-intent/:paymentIntentId/confirm',
  validateRequest(stripeValidation.paymentIntentId),
  stripeController.confirmPaymentIntent
);

// Plans and pricing moved to public routes above

export default router;
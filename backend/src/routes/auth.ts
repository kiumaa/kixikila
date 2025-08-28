import { Router } from 'express';
import { authController } from '../controllers/authController';
import { validateRequest } from '../middleware/validation';
import { authValidation } from '../validations/authValidation';
import { optionalAuthMiddleware } from '../middleware/auth';
import { authRateLimit, otpRateLimit, passwordResetRateLimit } from '../middleware/rateLimiting';

const router = Router();

// Public routes with rate limiting
router.post('/register', authRateLimit, validateRequest(authValidation.register), authController.register);
router.post('/login', authRateLimit, validateRequest(authValidation.login), authController.login);
router.post('/verify-otp', otpRateLimit, validateRequest(authValidation.verifyOtp), authController.verifyOtp);
router.post('/resend-otp', otpRateLimit, validateRequest(authValidation.resendOtp), authController.resendOtp);
router.post('/forgot-password', passwordResetRateLimit, validateRequest(authValidation.forgotPassword), authController.forgotPassword);
router.post('/reset-password', passwordResetRateLimit, validateRequest(authValidation.resetPassword), authController.resetPassword);
router.post('/refresh-token', authRateLimit, validateRequest(authValidation.refreshToken), authController.refreshToken);

// Protected routes
router.post('/logout', optionalAuthMiddleware, authController.logout);
router.get('/me', optionalAuthMiddleware, authController.getProfile);
router.post('/change-password', optionalAuthMiddleware, validateRequest(authValidation.changePassword), authController.changePassword);

export default router;
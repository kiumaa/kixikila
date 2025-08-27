import { Router } from 'express';
import { authController } from '../controllers/authController.ts';
import { validateRequest } from '../middleware/validation.ts';
import { authValidation } from '../validations/authValidation.ts';
import { optionalAuthMiddleware } from '../middleware/auth.ts';

const router = Router();

// Public routes
router.post('/register', validateRequest(authValidation.register), authController.register);
router.post('/login', validateRequest(authValidation.login), authController.login);
router.post('/verify-otp', validateRequest(authValidation.verifyOtp), authController.verifyOtp);
router.post('/resend-otp', validateRequest(authValidation.resendOtp), authController.resendOtp);
router.post('/forgot-password', validateRequest(authValidation.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validateRequest(authValidation.resetPassword), authController.resetPassword);
router.post('/refresh-token', validateRequest(authValidation.refreshToken), authController.refreshToken);

// Protected routes
router.post('/logout', optionalAuthMiddleware, authController.logout);
router.get('/me', optionalAuthMiddleware, authController.getProfile);
router.post('/change-password', optionalAuthMiddleware, validateRequest(authValidation.changePassword), authController.changePassword);

export default router;
import { Router } from 'express';
import { authController } from '../controllers/authController';
import { validateRequest } from '../middleware/validation';
import { authValidation } from '../validations/authValidation';
import { optionalAuthMiddleware } from '../middleware/auth';
import { authRateLimit, otpRateLimit, passwordResetRateLimit } from '../middleware/rateLimiting';
import { auditAuthEvent } from '../middleware/auditLogger';

const router = Router();

// Public routes with rate limiting and audit logging
router.post('/register', authRateLimit, auditAuthEvent('REGISTRATION'), validateRequest(authValidation.register), authController.register);
router.post('/login', authRateLimit, auditAuthEvent('LOGIN'), validateRequest(authValidation.login), authController.login);
router.post('/verify-otp', otpRateLimit, auditAuthEvent('OTP_VERIFICATION'), validateRequest(authValidation.verifyOtp), authController.verifyOtp);
router.post('/resend-otp', otpRateLimit, auditAuthEvent('OTP_RESEND'), validateRequest(authValidation.resendOtp), authController.resendOtp);
router.post('/forgot-password', passwordResetRateLimit, auditAuthEvent('PASSWORD_RESET_REQUEST'), validateRequest(authValidation.forgotPassword), authController.forgotPassword);
router.post('/reset-password', passwordResetRateLimit, auditAuthEvent('PASSWORD_RESET'), validateRequest(authValidation.resetPassword), authController.resetPassword);
router.post('/refresh-token', authRateLimit, auditAuthEvent('TOKEN_REFRESH'), validateRequest(authValidation.refreshToken), authController.refreshToken);

// Protected routes with audit logging
router.post('/logout', optionalAuthMiddleware, auditAuthEvent('LOGOUT'), authController.logout);
router.get('/me', optionalAuthMiddleware, auditAuthEvent('PROFILE_ACCESS'), authController.getProfile);
router.post('/change-password', optionalAuthMiddleware, auditAuthEvent('PASSWORD_CHANGE'), validateRequest(authValidation.changePassword), authController.changePassword);

export default router;
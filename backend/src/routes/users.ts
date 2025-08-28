import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { userValidation } from '../validations/userValidation';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// Profile management
router.get('/profile', userController.getProfile);
router.put('/profile', validateRequest(userValidation.updateProfile), userController.updateProfile);
router.delete('/account', validateRequest(userValidation.deleteAccount), userController.deleteAccount);

// Phone verification
router.post('/verify-phone', validateRequest(userValidation.verifyPhone), userController.verifyPhone);
router.post('/send-phone-verification', userController.sendPhoneVerification);

// User groups
router.get('/groups', userController.getUserGroups);

export default router;
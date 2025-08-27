import { Router } from 'express';
import { GroupController } from '../controllers/groupController';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { groupValidation } from '../validations/groupValidation';

const router = Router();

// All group routes require authentication
router.use(authMiddleware);

/**
 * @route GET /api/v1/groups
 * @desc Get all groups for user
 * @access Private
 */
router.get('/', validateRequest(groupValidation.searchGroups), GroupController.getUserGroups);

/**
 * @route POST /api/v1/groups
 * @desc Create new group
 * @access Private
 */
router.post('/', validateRequest(groupValidation.createGroup), GroupController.createGroup);

/**
 * @route GET /api/v1/groups/:id
 * @desc Get group details
 * @access Private
 */
router.get('/:id', validateRequest(groupValidation.groupIdParam), GroupController.getGroupById);

/**
 * @route PUT /api/v1/groups/:id
 * @desc Update group
 * @access Private
 */
router.put('/:id', validateRequest(groupValidation.updateGroup), GroupController.updateGroup);

/**
 * @route DELETE /api/v1/groups/:id
 * @desc Delete group
 * @access Private
 */
router.delete('/:id', validateRequest(groupValidation.groupIdParam), GroupController.deleteGroup);

/**
 * @route POST /api/v1/groups/:id/members
 * @desc Add member to group
 * @access Private
 */
router.post('/:id/members', validateRequest(groupValidation.addMember), GroupController.addMember);

/**
 * @route DELETE /api/v1/groups/:id/members/:memberId
 * @desc Remove member from group
 * @access Private
 */
router.delete('/:id/members/:memberId', validateRequest(groupValidation.removeMember), GroupController.removeMember);

/**
 * @route POST /api/v1/groups/:id/leave
 * @desc Leave group
 * @access Private
 */
router.post('/:id/leave', validateRequest(groupValidation.groupIdParam), GroupController.leaveGroup);

export default router;
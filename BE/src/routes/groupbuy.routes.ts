import { Router } from 'express';
import { GroupBuyEventController } from '../controllers/groupbuy.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/permission.middleware';
import { UserRole } from '../constants/roles';

const router = Router();
const groupBuyController = new GroupBuyEventController();

// ===== PUBLIC ROUTES =====

// Get all group buy events
router.get('/', groupBuyController.getAllGroupBuyEvents as any);

// Get active group buy events
router.get('/active', groupBuyController.getActiveGroupBuyEvents as any);

// Get group buy event by ID
router.get('/:id', groupBuyController.getGroupBuyEventById as any);

// ===== PROTECTED ROUTES =====

// Join group buy event
router.post('/:id/join', authenticate as any, groupBuyController.joinGroupBuyEvent as any);

// Update participation quantity
router.patch('/:id/update-quantity', authenticate as any, groupBuyController.updateParticipationQuantity as any);

// Leave group buy event
router.post('/:id/leave', authenticate as any, groupBuyController.leaveGroupBuyEvent as any);

// Get my participations
router.get('/my-participations', authenticate as any, groupBuyController.getMyParticipations as any);

// ===== ADMIN ROUTES =====

// Create group buy event (admin only)
router.post('/', authenticate as any, checkRole(UserRole.ADMIN, UserRole.MANAGER) as any, groupBuyController.createGroupBuyEvent as any);

// Update event status (admin only)
router.patch('/:id/status', authenticate as any, checkRole(UserRole.ADMIN, UserRole.MANAGER) as any, groupBuyController.updateEventStatus as any);

// Get group buy statistics (admin only)
router.get('/stats/summary', authenticate as any, checkRole(UserRole.ADMIN, UserRole.MANAGER) as any, groupBuyController.getGroupBuyStats as any);

export default router;

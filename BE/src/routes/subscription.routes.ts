import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/permission.middleware';
import { UserRole } from '../constants/roles';

const router = Router();
const subscriptionController = new SubscriptionController();

// ===== PROTECTED ROUTES =====

// Create subscription
router.post('/', authenticate as any, subscriptionController.createSubscription as any);

// Get my subscriptions
router.get('/my-subscriptions', authenticate as any, subscriptionController.getMySubscriptions as any);

// Get subscription by ID
router.get('/:id', authenticate as any, subscriptionController.getSubscriptionById as any);

// Update subscription
router.patch('/:id', authenticate as any, subscriptionController.updateSubscription as any);

// Update subscription items
router.patch('/:id/items', authenticate as any, subscriptionController.updateSubscriptionItems as any);

// Pause subscription
router.patch('/:id/pause', authenticate as any, subscriptionController.pauseSubscription as any);

// Resume subscription
router.patch('/:id/resume', authenticate as any, subscriptionController.resumeSubscription as any);

// Cancel subscription
router.patch('/:id/cancel', authenticate as any, subscriptionController.cancelSubscription as any);

// ===== ADMIN ROUTES =====

// Get all subscriptions (admin only)
router.get('/', authenticate as any, checkRole(UserRole.ADMIN, UserRole.MANAGER) as any, subscriptionController.getAllSubscriptions as any);

// Get deliveries for today (admin/shipper)
router.get('/deliveries/today', authenticate as any, checkRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.SHIPPER) as any, subscriptionController.getDeliveriesForToday as any);

// Get subscription statistics (admin only)
router.get('/stats/summary', authenticate as any, checkRole(UserRole.ADMIN, UserRole.MANAGER) as any, subscriptionController.getSubscriptionStats as any);

export default router;

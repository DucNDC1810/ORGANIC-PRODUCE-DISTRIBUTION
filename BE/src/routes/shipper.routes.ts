import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/permission.middleware';
import { UserRole } from '../constants/roles';
import shipperController from '../controllers/shipper.controller';

const router = Router();

// All routes require authentication and shipper role
router.use(authenticate as any);
router.use(checkRole(UserRole.SHIPPER, UserRole.ADMIN) as any);

// Dashboard statistics
router.get('/dashboard', shipperController.getDashboardStats as any);

// Available orders for shipper to pick
router.get('/available-orders', shipperController.getAvailableOrders as any);

// Shipper's assigned orders
router.get('/my-orders', shipperController.getMyOrders as any);

// Accept an order
router.post('/orders/:id/accept', shipperController.acceptOrder as any);

// Update order status
router.patch('/orders/:id/status', shipperController.updateOrderStatus as any);

// Get order details
router.get('/orders/:id', shipperController.getOrderDetails as any);

export default router;

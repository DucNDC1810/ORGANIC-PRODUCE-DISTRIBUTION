import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkPermission, checkRole } from '../middlewares/permission.middleware';
import { Permission, UserRole } from '../constants/roles';

const router = Router();
const orderController = new OrderController();

// ===== PUBLIC/PROTECTED ROUTES =====

// Create new order
router.post('/', authenticate as any, orderController.createOrder as any);

// Get my orders
router.get('/my-orders', authenticate as any, orderController.getMyOrders as any);

// Get order by ID
router.get('/:id', authenticate as any, orderController.getOrderById as any);

// Cancel order
router.patch('/:id/cancel', authenticate as any, orderController.cancelOrder as any);

// ===== ADMIN ROUTES =====

// Get all orders (admin only)
router.get('/', authenticate as any, checkRole(UserRole.ADMIN, UserRole.MANAGER) as any, orderController.getAllOrders as any);

// Update order status (admin only)
router.patch('/:id/status', authenticate as any, checkRole(UserRole.ADMIN, UserRole.MANAGER) as any, orderController.updateOrderStatus as any);

// Update payment status (admin only)
router.patch('/:id/payment-status', authenticate as any, checkRole(UserRole.ADMIN) as any, orderController.updatePaymentStatus as any);

// Delete order (admin only)
router.delete('/:id', authenticate as any, checkRole(UserRole.ADMIN) as any, orderController.deleteOrder as any);

// Get order statistics (admin only)
router.get('/stats/summary', authenticate as any, checkRole(UserRole.ADMIN, UserRole.MANAGER) as any, orderController.getOrderStats as any);

export default router;

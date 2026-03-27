import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkPermission, checkRole } from '../middlewares/permission.middleware';
import { Permission, UserRole } from '../constants/roles';

const router = Router();
const orderController = new OrderController();

// ─────────────────────────────────────────────────────────────
// NON-PARAMETERISED ROUTES  (must be declared before /:id)
// ─────────────────────────────────────────────────────────────

// Create new order
router.post(
  '/',
  authenticate as any,
  orderController.createOrder as any
);

// Get all orders with search / filter / pagination (manager+)
router.get(
  '/',
  authenticate as any,
  checkRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF) as any,
  orderController.getAllOrders as any
);

// Get my orders (authenticated user)
router.get(
  '/my-orders',
  authenticate as any,
  orderController.getMyOrders as any
);

// ── ORDER CONFIRMATION FEATURE ────────────────────────────────

// Bulk-confirm multiple pending orders
router.post(
  '/bulk-confirm',
  authenticate as any,
  checkRole(UserRole.ADMIN, UserRole.MANAGER) as any,
  orderController.bulkConfirmOrders as any
);

// Pending orders badge summary
router.get(
  '/pending-summary',
  authenticate as any,
  checkRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF) as any,
  orderController.getPendingSummary as any
);

// Order statistics
router.get(
  '/stats/summary',
  authenticate as any,
  checkRole(UserRole.ADMIN, UserRole.MANAGER) as any,
  orderController.getOrderStats as any
);

// ─────────────────────────────────────────────────────────────
// PARAMETERISED ROUTES  /:id
// ─────────────────────────────────────────────────────────────

// Get single order by ID
router.get(
  '/:id',
  authenticate as any,
  orderController.getOrderById as any
);

// Confirm a pending order (manager/admin only)
router.patch(
  '/:id/confirm',
  authenticate as any,
  checkRole(UserRole.ADMIN, UserRole.MANAGER) as any,
  orderController.confirmOrder as any
);

// Cancel order by manager/admin (bypasses owner check)
router.patch(
  '/:id/manager-cancel',
  authenticate as any,
  checkRole(UserRole.ADMIN, UserRole.MANAGER) as any,
  orderController.managerCancelOrder as any
);

// Update payment method (owner only, pending subscription orders)
router.patch(
  '/:id/payment-method',
  authenticate as any,
  orderController.updatePaymentMethod as any
);

// Cancel order (owner or manager)
router.patch(
  '/:id/cancel',
  authenticate as any,
  orderController.cancelOrder as any
);

// Update generic order status (admin/manager)
router.patch(
  '/:id/status',
  authenticate as any,
  checkRole(UserRole.ADMIN, UserRole.MANAGER) as any,
  orderController.updateOrderStatus as any
);

// Update payment status (admin only)
router.patch(
  '/:id/payment-status',
  authenticate as any,
  checkRole(UserRole.ADMIN) as any,
  orderController.updatePaymentStatus as any
);

// Process a returned order — manager/admin only
router.patch(
  '/:id/process-return',
  authenticate as any,
  checkRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF) as any,
  orderController.processReturnedOrder as any
);

// Delete order (admin only)
router.delete(
  '/:id',
  authenticate as any,
  checkRole(UserRole.ADMIN) as any,
  orderController.deleteOrder as any
);

export default router;

import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/permission.middleware';
import { UserRole } from '../constants/roles';

const router = Router();
const paymentController = new PaymentController();

// ===== PROTECTED ROUTES =====

// Create payment
router.post('/', authenticate as any, paymentController.createPayment as any);

// Get my payments
router.get('/my-payments', authenticate as any, paymentController.getMyPayments as any);

// Get payment by ID
router.get('/:id', authenticate as any, paymentController.getPaymentById as any);

// Get payment by transaction ID
router.get('/transaction/:transactionId', authenticate as any, paymentController.getPaymentByTransactionId as any);

// Confirm payment
router.patch('/:id/confirm', authenticate as any, paymentController.confirmPayment as any);

// Fail payment
router.patch('/:id/fail', authenticate as any, paymentController.failPayment as any);

// Refund payment
router.patch('/:id/refund', authenticate as any, paymentController.refundPayment as any);

// Cancel payment
router.patch('/:id/cancel', authenticate as any, paymentController.cancelPayment as any);

// Retry payment
router.post('/:id/retry', authenticate as any, paymentController.retryPayment as any);

// ===== ADMIN ROUTES =====

// Get all payments (admin only)
router.get('/', authenticate as any, checkRole(UserRole.ADMIN, UserRole.MANAGER) as any, paymentController.getAllPayments as any);

// Get payment statistics (admin only)
router.get('/stats/summary', authenticate as any, checkRole(UserRole.ADMIN, UserRole.MANAGER) as any, paymentController.getPaymentStats as any);

export default router;

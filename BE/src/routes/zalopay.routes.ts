import { Router } from 'express';
import ZaloPayController from '../controllers/zalopay.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../constants/roles';

const router = Router();

/**
 * @route   POST /api/zalopay/init
 * @desc    Initialize ZaloPay payment
 * @access  Private
 */
router.post(
  '/init',
  authenticate as any,
  ZaloPayController.initPayment as any
);

/**
 * @route   POST /api/zalopay/check-status
 * @desc    Check ZaloPay payment status
 * @access  Private
 */
router.post(
  '/check-status',
  authenticate as any,
  ZaloPayController.checkPaymentStatus as any
);

/**
 * @route   POST /api/zalopay/callback
 * @desc    ZaloPay webhook callback (no auth required)
 * @access  Public
 */
router.post('/callback', ZaloPayController.handleCallback as any);

/**
 * @route   POST /api/zalopay/verify-return
 * @desc    Verify and update payment status when user returns from ZaloPay
 * @access  Public (with orderId verification)
 */
router.post('/verify-return', ZaloPayController.verifyReturn as any);

/**
 * @route   POST /api/zalopay/refund
 * @desc    Refund ZaloPay payment (admin only)
 * @access  Private (Admin)
 */
router.post(
  '/refund',
  authenticate as any,
  authorize(UserRole.ADMIN) as any,
  ZaloPayController.refundPayment as any
);

/**
 * @route   POST /api/zalopay/cancel
 * @desc    Cancel ZaloPay payment
 * @access  Private
 */
router.post(
  '/cancel',
  authenticate as any,
  ZaloPayController.cancelPayment as any
);

/**
 * @route   GET /api/zalopay/payment/:transactionId
 * @desc    Get payment by transaction ID
 * @access  Private
 */
router.get(
  '/payment/:transactionId',
  authenticate as any,
  ZaloPayController.getPaymentByTransactionId as any
);

/**
 * @route   POST /api/zalopay/test-callback
 * @desc    Test callback for sandbox (simulate successful payment)
 * @access  Public (only in development)
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/test-callback', ZaloPayController.testCallback as any);
}

export default router;

import { Router } from 'express';
import ZaloPayController from '../controllers/zalopay.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/zalopay/init
 * @desc    Tạo đơn hàng trên ZaloPay (alias cho create-order)
 * @access  Private
 */
router.post(
  '/init',
  authenticate as any,
  ZaloPayController.createOrder as any
);

/**
 * @route   POST /api/zalopay/create-order
 * @desc    Tạo đơn hàng trên ZaloPay
 * @access  Private
 */
router.post(
  '/create-order',
  authenticate as any,
  ZaloPayController.createOrder as any
);

/**
 * @route   POST /api/zalopay/callback
 * @desc    ZaloPay webhook callback (xử lý thanh toán thành công)
 * @access  Public (không cần authentication)
 */
router.post('/callback', ZaloPayController.handleCallback as any);

/**
 * @route   POST /api/zalopay/check-order-status
 * @desc    Kiểm tra trạng thái đơn hàng từ ZaloPay
 * @access  Private
 */
router.post(
  '/check-order-status',
  authenticate as any,
  ZaloPayController.checkOrderStatus as any
);

/**
 * @route   POST /api/zalopay/test-callback
 * @desc    Test callback (simulate ZaloPay callback) - FOR TESTING ONLY
 * @access  Private
 */
router.post(
  '/test-callback',
  authenticate as any,
  ZaloPayController.testCallback as any
);

export default router;

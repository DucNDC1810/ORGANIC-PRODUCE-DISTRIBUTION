import { Router } from 'express';
import MoMoController from '../controllers/momo.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/momo/create-payment
 * @desc    Tạo link thanh toán MoMo
 * @access  Private
 */
router.post(
  '/create-payment',
  authenticate as any,
  MoMoController.createPayment as any
);

/**
 * @route   POST /api/momo/callback
 * @desc    MoMo webhook callback (xử lý thanh toán thành công)
 * @access  Public (không cần authentication)
 */
router.post('/callback', MoMoController.handleCallback as any);

/**
 * @route   POST /api/momo/query-payment
 * @desc    Truy vấn trạng thái giao dịch từ MoMo
 * @access  Private
 */
router.post(
  '/query-payment',
  authenticate as any,
  MoMoController.queryPayment as any
);

export default router;

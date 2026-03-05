import { Router } from 'express';
import WalletController from '../controllers/wallet.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   GET /api/wallet/balance
 * @desc    Lấy số dư ví + 20 giao dịch gần nhất
 * @access  Private
 */
router.get('/balance', authenticate as any, WalletController.getWalletInfo as any);

/**
 * @route   POST /api/wallet/topup
 * @desc    Tạo link nạp tiền ví qua MoMo
 * @access  Private
 * @body    { amount: number }
 */
router.post('/topup', authenticate as any, WalletController.topUpWallet as any);

/**
 * @route   POST /api/wallet/verify-topup
 * @desc    Xác nhận nạp tiền sau khi MoMo redirect (fallback khi IPN không tới được server)
 * @access  Private
 * @body    { orderId: "topup_<transactionId>", requestId?: string }
 */
router.post('/verify-topup', authenticate as any, WalletController.verifyTopUp as any);

/**
 * @route   POST /api/wallet/pay
 * @desc    Thanh toán đơn hàng bằng ví FreshMarket (Mongoose Session)
 * @access  Private
 * @body    { items, totalAmount, deliveryInfo?, addressId?, ... }
 */
router.post('/pay', authenticate as any, WalletController.payWithWallet as any);

/**
 * @route   GET /api/wallet/transactions
 * @desc    Lịch sử giao dịch ví có phân trang
 * @access  Private
 * @query   page, limit, type (topup|payment|refund)
 */
router.get('/transactions', authenticate as any, WalletController.getTransactionHistory as any);

/**
 * @route   POST /api/wallet/transfer
 * @desc    Chuyển tiền từ ví người dùng sang ví người khác (chia tiền nhóm)
 * @access  Private
 * @body    { toUserId: string, amount: number, description?: string }
 */
router.post('/transfer', authenticate as any, WalletController.transferToUser as any);

export default router;

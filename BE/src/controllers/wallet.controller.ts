import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.model';
import { Order } from '../models/Order.model';
import { Transaction } from '../models/Transaction.model';
import momoService from '../services/momo.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../utils/AppError';

export class WalletController {
  /**
   * Lấy số dư và lịch sử giao dịch ví
   * GET /api/wallet/balance
   */
  getWalletInfo = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('User not authenticated', 401);

      const user = await User.findById(userId).select('walletBalance');
      if (!user) throw new AppError('User not found', 404);

      const transactions = await Transaction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('orderId', 'orderDate totalAmount status');

      res.status(200).json({
        success: true,
        data: {
          walletBalance: user.walletBalance,
          transactions
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Tạo yêu cầu nạp tiền vào ví qua MoMo
   * POST /api/wallet/topup
   * Body: { amount: number }
   */
  topUpWallet = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('User not authenticated', 401);

      const { amount, groupId: rawGroupId, returnPath: rawReturnPath } = req.body;
      if (!amount || amount <= 0) {
        throw new AppError('Amount must be a positive number', 400);
      }
      if (amount < 10000) {
        throw new AppError('Minimum top-up amount is 10,000 VND', 400);
      }

      // Sanitise optional context params to prevent injection
      const safeGroupId =
        typeof rawGroupId === 'string' && /^[a-fA-F0-9]{24}$/.test(rawGroupId)
          ? rawGroupId
          : null;
      const safeReturnPath =
        typeof rawReturnPath === 'string' && rawReturnPath.startsWith('/') && rawReturnPath.length <= 200
          ? rawReturnPath
          : null;

      // Tạo transaction pending để lưu trước khi gọi MoMo
      const transaction = await Transaction.create({
        userId,
        amount: Math.floor(amount),
        type: 'topup',
        status: 'pending',
        description: `Top-up to FreshMarket Wallet`,
        metadata: safeGroupId ? { groupId: safeGroupId } : {}
      });

      // orderId gửi MoMo = "topup_<transactionId>" để webhook phân biệt với đơn hàng thường
      const momoOrderId = `topup_${transaction._id.toString()}`;

      const feOrigin = req.headers.origin || process.env.FE_BASE_URL || 'http://localhost:5173';
      // Embed returnPath & groupId so MoMo redirects user back to the correct page
      const redirectUrl = safeReturnPath || safeGroupId
        ? `${feOrigin}/wallet-topup?returnPath=${encodeURIComponent(safeReturnPath ?? '/group-order/active')}${safeGroupId ? '&groupId=' + encodeURIComponent(safeGroupId) : ''}`
        : `${feOrigin}/wallet-topup`;

      try {
        const momoResponse = await momoService.createPayment(
          Math.floor(amount),
          `Nạp tiền ví FreshMarket - ${Math.floor(amount).toLocaleString('vi-VN')} VND`,
          `Nạp tiền ví FreshMarket`,
          redirectUrl,
          momoOrderId
        );

        // Lưu momoOrderId vào metadata để webhook tra cứu (giữ lại groupId đã lưu)
        await Transaction.findByIdAndUpdate(transaction._id, {
          $set: {
            'metadata.momoOrderId': momoResponse.orderId,
            'metadata.requestId': momoResponse.requestId
          }
        });

        res.status(200).json({
          success: true,
          message: 'Top-up payment link created successfully',
          data: {
            transactionId: transaction._id,
            amount: Math.floor(amount),
            payUrl: momoResponse.payUrl,
            deeplink: momoResponse.deeplink,
            qrCodeUrl: momoResponse.qrCodeUrl,
            momoOrderId: momoResponse.orderId
          }
        });
      } catch (momoError) {
        // Nếu gọi MoMo thất bại, cập nhật transaction thành failed
        await Transaction.findByIdAndUpdate(transaction._id, { status: 'failed' });
        throw momoError;
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Thanh toán đơn hàng bằng ví FreshMarket
   * POST /api/wallet/pay
   * Body: { addressId?, deliveryInfo?, items, totalAmount, notes?, voucherId?, pickupLocation? }
   *
   * Dùng Mongoose Session để đảm bảo tính nguyên tử:
   * - Nếu trừ ví lỗi → không tạo đơn hàng
   * - Nếu tạo đơn hàng lỗi → không trừ ví
   */
  payWithWallet = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('User not authenticated', 401);

      const {
        addressId,
        deliveryInfo,
        items,
        totalAmount,
        notes,
        voucherId,
        pickupLocation,
        discountAmount,
        shippingCost
      } = req.body;

      if (!items || items.length === 0) {
        throw new AppError('Items are required', 400);
      }
      if (!totalAmount || totalAmount <= 0) {
        throw new AppError('Total amount must be a positive number', 400);
      }

      // 1. Kiểm tra và trừ số dư ví (atomic với $inc)
      const updatedUser = await User.findOneAndUpdate(
        {
          _id: userId,
          walletBalance: { $gte: totalAmount }   // điều kiện: đủ tiền
        },
        {
          $inc: { walletBalance: -totalAmount }  // trừ tiền
        },
        { new: true, session }
      );

      if (!updatedUser) {
        // Có thể user không tồn tại, hoặc số dư không đủ — check để trả lỗi rõ hơn
        const user = await User.findById(userId).session(session);
        if (!user) throw new AppError('User not found', 404);
        throw new AppError(
          `Số dư ví không đủ. Số dư hiện tại: ${user.walletBalance.toLocaleString('vi-VN')} VND, cần thanh toán: ${totalAmount.toLocaleString('vi-VN')} VND`,
          400
        );
      }

      // 2. Tạo đơn hàng với paymentStatus: 'paid'
      const [order] = await Order.create(
        [
          {
            userId,
            addressId: addressId || null,
            deliveryInfo: deliveryInfo || {},
            pickupLocation: pickupLocation || null,
            voucherId: voucherId || null,
            items,
            paymentMethod: 'wallet',
            paymentStatus: 'paid',
            totalAmount,
            discountAmount: discountAmount || 0,
            shippingCost: shippingCost || 0,
            notes,
            status: 'confirmed',
            orderDate: new Date()
          }
        ],
        { session }
      );

      // 3. Lưu giao dịch payment vào bảng transactions
      await Transaction.create(
        [
          {
            userId,
            amount: totalAmount,
            type: 'payment',
            status: 'success',
            orderId: order._id,
            description: `Payment for order #${order._id}`
          }
        ],
        { session }
      );

      // 4. Commit transaction — tất cả hoặc không gì cả
      await session.commitTransaction();
      session.endSession();

      await order.populate('items.productId', 'name price thumbnail');

      res.status(201).json({
        success: true,
        message: 'Order placed successfully using wallet',
        data: {
          order,
          walletBalance: updatedUser.walletBalance
        }
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      next(error);
    }
  };

  /**
   * Chuyển tiền từ ví người dùng sang ví chủ nhóm (chia tiền nhóm)
   * POST /api/wallet/transfer
   * Body: { toUserId: string, amount: number, description?: string }
   */
  transferToUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const fromUserId = req.user?.id;
      if (!fromUserId) throw new AppError('User not authenticated', 401);

      const { toUserId, amount, description } = req.body;

      if (!toUserId) throw new AppError('Recipient user ID is required', 400);
      if (!amount || amount <= 0) throw new AppError('Amount must be a positive number', 400);
      if (fromUserId === toUserId) throw new AppError('Cannot transfer to yourself', 400);

      // 1. Kiểm tra người nhận tồn tại
      const toUser = await User.findById(toUserId).session(session);
      if (!toUser) throw new AppError('Recipient not found', 404);

      // 2. Trừ ví người gửi (atomic)
      const updatedSender = await User.findOneAndUpdate(
        { _id: fromUserId, walletBalance: { $gte: amount } },
        { $inc: { walletBalance: -amount } },
        { new: true, session }
      );

      if (!updatedSender) {
        const sender = await User.findById(fromUserId).session(session);
        if (!sender) throw new AppError('User not found', 404);
        throw new AppError(
          `Số dư ví không đủ. Hiện có: ${sender.walletBalance.toLocaleString('vi-VN')}đ, cần: ${amount.toLocaleString('vi-VN')}đ`,
          400
        );
      }

      // 3. Cộng ví người nhận
      await User.findByIdAndUpdate(
        toUserId,
        { $inc: { walletBalance: amount } },
        { session }
      );

      const txDescription = description || `Trả tiền cho ${toUser.name}`;

      // 4. Ghi transaction cho người gửi (payment out)
      await Transaction.create(
        [{ userId: fromUserId, amount, type: 'payment', status: 'success', description: txDescription }],
        { session }
      );

      // 5. Ghi transaction cho người nhận (refund/receive)
      await Transaction.create(
        [{ userId: toUserId, amount, type: 'refund', status: 'success', description: `Received from ${updatedSender.name}` }],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        success: true,
        message: 'Chuyển tiền thành công',
        data: {
          amount,
          toUser: { id: toUser._id, name: toUser.name },
          walletBalance: updatedSender.walletBalance
        }
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      next(error);
    }
  };

  /**
   * Xác nhận nạp ví sau khi MoMo redirect về FE
   * POST /api/wallet/verify-topup
   * Body: { orderId: "topup_<transactionId>", requestId: "topup_<transactionId>" }
   *
   * Dùng để xử lý trường hợp IPN không tới được server (ngrok hết hạn, v.v.)
   * FE gọi endpoint này ngay sau khi được MoMo redirect về trang kết quả.
   */
  verifyTopUp = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('User not authenticated', 401);

      const { orderId, requestId } = req.body;
      if (!orderId || typeof orderId !== 'string' || !orderId.startsWith('topup_')) {
        throw new AppError('Invalid orderId for top-up verification', 400);
      }

      const transactionId = orderId.replace('topup_', '');
      const txn = await Transaction.findById(transactionId);
      if (!txn) throw new AppError('Transaction not found', 404);

      // Chỉ xử lý giao dịch thuộc về user đang đăng nhập
      if (txn.userId.toString() !== userId) throw new AppError('Unauthorized', 403);

      // Nếu đã cập nhật thành công (IPN đã xử lý trước), trả về kết quả luôn
      if (txn.status === 'success') {
        const user = await User.findById(userId).select('walletBalance');
        res.status(200).json({
          success: true,
          message: 'Top-up already confirmed',
          data: { walletBalance: user?.walletBalance ?? 0, alreadyProcessed: true }
        });
        return;
      }

      if (txn.status === 'failed') {
        throw new AppError('Top-up transaction was marked as failed', 400);
      }

      // Gọi MoMo query API để xác nhận trạng thái
      const effectiveRequestId = requestId || orderId;
      console.log(`🔍 Verifying top-up via MoMo query: orderId=${orderId}, requestId=${effectiveRequestId}`);
      const statusResponse = await momoService.queryPayment(orderId, effectiveRequestId);
      console.log(`📥 MoMo query result: resultCode=${statusResponse.resultCode}`);

      if (statusResponse.resultCode !== 0) {
        // MoMo xác nhận thất bại — đánh dấu failed
        await Transaction.findByIdAndUpdate(transactionId, { status: 'failed' });
        throw new AppError(
          `Top-up payment failed: ${statusResponse.resultDescription || statusResponse.message || 'Payment not completed'}`,
          400
        );
      }

      // Thanh toán hợp lệ — cập nhật nguyên tử
      const session = await mongoose.startSession();
      session.startTransaction();
      let bonusAwarded = false;
      try {
        // Re-read trong session để tránh race condition với IPN
        const txnInSession = await Transaction.findById(transactionId).session(session);
        if (!txnInSession) {
          await session.abortTransaction();
          session.endSession();
          throw new AppError('Transaction not found', 404);
        }

        if (txnInSession.status !== 'success') {
          await User.findByIdAndUpdate(
            txnInSession.userId,
            { $inc: { walletBalance: txnInSession.amount } },
            { session }
          );
          await Transaction.findByIdAndUpdate(
            transactionId,
            {
              status: 'success',
              metadata: {
                momoTransId: statusResponse.transId,
                verifiedAt: new Date(),
                verifiedBy: 'client-verify',
              }
            },
            { session }
          );
          console.log(`✅ Top-up verified & credited: +${txnInSession.amount} VND for user ${userId}`);

          // ── Thưởng nạp tiền lần đầu: +10.000₫ ──────────────────────────
          const FIRST_TOPUP_BONUS = 10000;
          const userRecord = await User.findById(txnInSession.userId).session(session);
          if (userRecord && !userRecord.firstTopupBonusClaimed) {
            await User.findByIdAndUpdate(
              txnInSession.userId,
              { $inc: { walletBalance: FIRST_TOPUP_BONUS }, $set: { firstTopupBonusClaimed: true } },
              { session }
            );
            await Transaction.create(
              [{
                userId: txnInSession.userId,
                amount: FIRST_TOPUP_BONUS,
                type: 'bonus',
                status: 'success',
                description: 'First top-up bonus (+10,000₫)'
              }],
              { session }
            );
            bonusAwarded = true;
            console.log(`🎁 First top-up bonus +${FIRST_TOPUP_BONUS} VND for user ${userId}`);
          }
          // ── END bonus ───────────────────────────────────────────────────
        }

        await session.commitTransaction();
        session.endSession();
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
      }

      const updatedUser = await User.findById(userId).select('walletBalance');
      res.status(200).json({
        success: true,
        message: 'Top-up confirmed and wallet credited',
        data: { walletBalance: updatedUser?.walletBalance ?? 0, alreadyProcessed: false, bonusAwarded }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy lịch sử giao dịch ví có phân trang
   * GET /api/wallet/transactions
   */
  getTransactionHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('User not authenticated', 401);

      const { page = 1, limit = 10, type } = req.query;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;

      const filter: any = { userId };
      if (type) filter.type = type;

      const [transactions, total] = await Promise.all([
        Transaction.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('orderId', 'orderDate totalAmount status'),
        Transaction.countDocuments(filter)
      ]);

      res.status(200).json({
        success: true,
        data: transactions,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum
        }
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new WalletController();


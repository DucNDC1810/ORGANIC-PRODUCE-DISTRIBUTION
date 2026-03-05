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

      const { amount } = req.body;
      if (!amount || amount <= 0) {
        throw new AppError('Amount must be a positive number', 400);
      }
      if (amount < 10000) {
        throw new AppError('Minimum top-up amount is 10,000 VND', 400);
      }

      // Tạo transaction pending để lưu trước khi gọi MoMo
      const transaction = await Transaction.create({
        userId,
        amount: Math.floor(amount),
        type: 'topup',
        status: 'pending',
        description: `Nạp tiền vào ví FreshMarket`
      });

      // orderId gửi MoMo = "topup_<transactionId>" để webhook phân biệt với đơn hàng thường
      const momoOrderId = `topup_${transaction._id.toString()}`;

      const feOrigin = req.headers.origin || process.env.FE_BASE_URL || 'http://localhost:5173';
      const redirectUrl = `${feOrigin}/wallet?topup=success`;

      try {
        const momoResponse = await momoService.createPayment(
          Math.floor(amount),
          `Nạp tiền ví FreshMarket - ${Math.floor(amount).toLocaleString('vi-VN')} VND`,
          `Nạp tiền ví FreshMarket`,
          redirectUrl,
          momoOrderId
        );

        // Lưu momoOrderId vào metadata để webhook tra cứu
        await Transaction.findByIdAndUpdate(transaction._id, {
          metadata: {
            momoOrderId: momoResponse.orderId,
            requestId: momoResponse.requestId
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
            description: `Thanh toán đơn hàng #${order._id}`
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
        [{ userId: toUserId, amount, type: 'refund', status: 'success', description: `Nhận tiền từ ${updatedSender.name}` }],
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


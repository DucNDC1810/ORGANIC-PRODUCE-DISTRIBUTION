import { Response, NextFunction } from 'express';
import { Payment } from '../models/Payment.model';
import { Order } from '../models/Order.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../utils/AppError';

export class PaymentController {
  /**
   * Create a new payment
   * POST /api/payments
   */
  createPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId, paymentMethod, amount, transactionId, description, metadata } = req.body;

      if (!orderId || !paymentMethod || !amount) {
        throw new AppError('Order ID, payment method, and amount are required', 400);
      }

      // Validate payment method
      const validMethods = ['credit_card', 'debit_card', 'cash', 'bank_transfer', 'e_wallet'];
      if (!validMethods.includes(paymentMethod)) {
        throw new AppError(`Invalid payment method. Must be one of: ${validMethods.join(', ')}`, 400);
      }

      // Check if order exists
      const order = await Order.findById(orderId);
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      // Check if user is owner or admin
      if (req.user?.role !== 'admin' && req.user?.id !== order.userId.toString()) {
        throw new AppError('You do not have permission to create payment for this order', 403);
      }

      // Check if payment already exists for this order
      const existingPayment = await Payment.findOne({ orderId, paymentStatus: { $ne: 'failed' } });
      if (existingPayment && existingPayment.paymentStatus !== 'failed') {
        throw new AppError('Payment already exists for this order', 400);
      }

      const payment = await Payment.create({
        orderId,
        paymentMethod,
        amount,
        transactionId: transactionId || `TXN-${Date.now()}`,
        description,
        metadata,
        paymentStatus: 'pending',
        paymentDate: new Date()
      });

      res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        data: payment
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all payments with filters and pagination
   * GET /api/payments
   */
  getAllPayments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 10, status, paymentMethod, orderId, sortBy = 'paymentDate', sortOrder = 'desc' } =
        req.query;

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;

      const filter: any = {};

      if (status) {
        filter.paymentStatus = status;
      }

      if (paymentMethod) {
        filter.paymentMethod = paymentMethod;
      }

      if (orderId) {
        filter.orderId = orderId;
      }

      const sortObj: any = {};
      sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

      const payments = await Payment.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate('orderId', 'userId totalAmount status');

      const total = await Payment.countDocuments(filter);
      const pages = Math.ceil(total / limitNum);

      res.status(200).json({
        success: true,
        data: payments,
        pagination: {
          currentPage: pageNum,
          totalPages: pages,
          totalItems: total,
          itemsPerPage: limitNum
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get payments for logged-in user
   * GET /api/payments/my-payments
   */
  getMyPayments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10, status } = req.query;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;

      const filter: any = {};

      if (status) {
        filter.paymentStatus = status;
      }

      // Find orders by user and then get payments
      const orders = await Order.find({ userId }, '_id');
      const orderIds = orders.map((o) => o._id);

      filter.orderId = { $in: orderIds };

      const payments = await Payment.find(filter)
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('orderId', 'totalAmount status');

      const total = await Payment.countDocuments(filter);
      const pages = Math.ceil(total / limitNum);

      res.status(200).json({
        success: true,
        data: payments,
        pagination: {
          currentPage: pageNum,
          totalPages: pages,
          totalItems: total,
          itemsPerPage: limitNum
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get payment by ID
   * GET /api/payments/:id
   */
  getPaymentById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const payment = await Payment.findById(id).populate('orderId');

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      // Check if user is owner or admin
      const order = await Order.findById(payment.orderId);
      if (req.user?.role !== 'admin' && req.user?.id !== order?.userId.toString()) {
        throw new AppError('You do not have permission to view this payment', 403);
      }

      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Confirm payment (mark as paid)
   * PATCH /api/payments/:id/confirm
   */
  confirmPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { transactionId } = req.body;

      const payment = await Payment.findById(id);

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      if (payment.paymentStatus !== 'pending') {
        throw new AppError(`Cannot confirm ${payment.paymentStatus} payment`, 400);
      }

      const updatedPayment = await Payment.findByIdAndUpdate(
        id,
        {
          paymentStatus: 'paid',
          transactionId: transactionId || payment.transactionId,
          paymentDate: new Date()
        },
        { new: true, runValidators: true }
      );

      // Update order payment status
      await Order.findByIdAndUpdate(payment.orderId, {
        paymentStatus: 'paid'
      });

      res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
        data: updatedPayment
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark payment as failed
   * PATCH /api/payments/:id/fail
   */
  failPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { failureReason } = req.body;

      const payment = await Payment.findById(id);

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      if (payment.paymentStatus !== 'pending') {
        throw new AppError(`Cannot fail ${payment.paymentStatus} payment`, 400);
      }

      const updatedPayment = await Payment.findByIdAndUpdate(
        id,
        {
          paymentStatus: 'failed',
          failureReason: failureReason || 'Payment processing failed'
        },
        { new: true, runValidators: true }
      );

      // Update order payment status
      await Order.findByIdAndUpdate(payment.orderId, {
        paymentStatus: 'failed'
      });

      res.status(200).json({
        success: true,
        message: 'Payment marked as failed',
        data: updatedPayment
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refund payment
   * PATCH /api/payments/:id/refund
   */
  refundPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { refundAmount } = req.body;

      const payment = await Payment.findById(id);

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      if (payment.paymentStatus !== 'paid') {
        throw new AppError(`Only paid payments can be refunded. Current status: ${payment.paymentStatus}`, 400);
      }

      const amount = refundAmount || payment.amount;

      if (amount > payment.amount) {
        throw new AppError(`Refund amount cannot exceed payment amount (${payment.amount})`, 400);
      }

      const updatedPayment = await Payment.findByIdAndUpdate(
        id,
        {
          paymentStatus: amount === payment.amount ? 'refunded' : 'refunded',
          refundAmount: amount,
          refundedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: 'Payment refunded successfully',
        data: updatedPayment
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cancel payment
   * PATCH /api/payments/:id/cancel
   */
  cancelPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const payment = await Payment.findById(id);

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      if (!['pending', 'failed'].includes(payment.paymentStatus)) {
        throw new AppError(`Cannot cancel ${payment.paymentStatus} payment`, 400);
      }

      const updatedPayment = await Payment.findByIdAndUpdate(
        id,
        { paymentStatus: 'cancelled' },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: 'Payment cancelled successfully',
        data: updatedPayment
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retry payment
   * POST /api/payments/:id/retry
   */
  retryPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const payment = await Payment.findById(id);

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      if (payment.paymentStatus !== 'failed') {
        throw new AppError(`Can only retry failed payments. Current status: ${payment.paymentStatus}`, 400);
      }

      const updatedPayment = await Payment.findByIdAndUpdate(
        id,
        {
          paymentStatus: 'pending',
          failureReason: undefined
        },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: 'Payment retry initiated',
        data: updatedPayment
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get payment by transaction ID
   * GET /api/payments/transaction/:transactionId
   */
  getPaymentByTransactionId = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { transactionId } = req.params;

      const payment = await Payment.findOne({ transactionId }).populate('orderId');

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get payment statistics
   * GET /api/payments/stats/summary
   */
  getPaymentStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      const filter: any = {};

      if (startDate && endDate) {
        filter.paymentDate = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }

      const stats = await Payment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$paymentStatus',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      const methodStats = await Payment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      const totalPayments = await Payment.countDocuments(filter);
      const totalRevenue = (
        await Payment.aggregate([
          { $match: { ...filter, paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      )[0]?.total || 0;

      res.status(200).json({
        success: true,
        data: {
          totalPayments,
          totalRevenue,
          byStatus: stats,
          byPaymentMethod: methodStats
        }
      });
    } catch (error) {
      next(error);
    }
  };
}

import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order.model';
import { Address } from '../models/Address.model';
import { User } from '../models/User.model';
import { Product } from '../models/Product.model';
import { Voucher } from '../models/Voucher.model';
import { VoucherUsage } from '../models/VoucherUsage.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../utils/AppError';
import { createNotification } from '../models/Notification.model';

export class OrderController {
  /**
   * Create a new order
   * POST /api/orders
   */
  createOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { addressId, deliveryInfo, voucherId, voucherCode, items, paymentMethod, isRecurring, subscriptionFrequency, notes, pickupLocation, discountAmount: clientDiscount } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!items || items.length === 0) {
        throw new AppError('Items are required', 400);
      }

      // Validate and deduct stock
      const productIds = items.map((item: any) => item.productId);
      const products = await Product.find({ _id: { $in: productIds } });
      for (const item of items) {
        const product = products.find(p => p._id.toString() === item.productId?.toString());
        if (!product) {
          throw new AppError(`Product not found: ${item.productId}`, 404);
        }
        if (product.stock < item.quantity) {
          throw new AppError(`Product "${product.name}" has insufficient stock. Available: ${product.stock}, Requested: ${item.quantity}`, 400);
        }
      }
      const stockDeductOps = items.map((item: any) => ({
        updateOne: {
          filter: { _id: item.productId, stock: { $gte: item.quantity } },
          update: { $inc: { stock: -item.quantity } }
        }
      }));
      await Product.bulkWrite(stockDeductOps);

      // Calculate subtotal
      let subtotal = 0;
      items.forEach((item: any) => {
        subtotal += item.subtotal;
      });

      // ── Voucher validation & discount ──────────────────────────────────
      let resolvedVoucherId = voucherId || null;
      let voucherDiscountAmount = 0;

      if (voucherCode) {
        const escapedCode = voucherCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const voucher = await Voucher.findOne({ code: { $regex: new RegExp(`^${escapedCode}$`, 'i') } });

        if (!voucher) {
          throw new AppError('Voucher not found', 404);
        }

        const now = new Date();
        if (!voucher.isActive) throw new AppError('Voucher is not active', 400);
        if (now < voucher.startDate) throw new AppError('Voucher is not yet active', 400);
        if (now > voucher.expiryDate) throw new AppError('Voucher has expired', 400);
        if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
          throw new AppError('Voucher usage limit reached', 400);
        }
        if (subtotal < (voucher.minPurchaseAmount || 0)) {
          throw new AppError(`Minimum purchase amount is ${voucher.minPurchaseAmount}`, 400);
        }

        // Check VoucherUsage: pending or used = blocked
        const existingUsage = await VoucherUsage.findOne({
          userId,
          voucherId: voucher._id,
          status: { $in: ['used', 'pending'] },
        });
        if (existingUsage) {
          throw new AppError('You have used this discount code.', 400);
        }

        // Calculate discount
        if (voucher.discountType === 'fixed') {
          voucherDiscountAmount = voucher.discountAmount || 0;
        } else {
          voucherDiscountAmount = Math.round((subtotal * (voucher.discountPercentage || 0)) / 100);
          if (voucher.maxDiscountAmount && voucherDiscountAmount > voucher.maxDiscountAmount) {
            voucherDiscountAmount = voucher.maxDiscountAmount;
          }
        }

        resolvedVoucherId = voucher._id;
      }
      // ──────────────────────────────────────────────────────────────────

      const totalDiscount = clientDiscount || voucherDiscountAmount;
      const isCOD = paymentMethod === 'cod';

      const order = await Order.create({
        userId,
        orderType: 'regular',
        addressId: addressId || null,
        deliveryInfo: deliveryInfo || {},
        pickupLocation: pickupLocation || null,
        voucherId: resolvedVoucherId,
        items,
        paymentMethod: paymentMethod || 'credit_card',
        paymentStatus: isCOD ? 'unpaid' : 'pending',
        totalAmount: subtotal,
        discountAmount: totalDiscount,
        notes,
        status: 'pending',
        orderDate: new Date(),
        isRecurring: isRecurring === true || isRecurring === 'true',
        subscriptionFrequency: subscriptionFrequency || null
      });

      // ── Step 2: Create pending VoucherUsage (soft lock) ────────────────
      if (resolvedVoucherId && voucherCode) {
        await VoucherUsage.create({
          userId,
          voucherId: resolvedVoucherId,
          orderId: order._id,
          status: 'pending',
        });
      }
      // ──────────────────────────────────────────────────────────────────

      await order.populate('userId', 'name email phone');
      await order.populate('items.productId', 'name price');

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order
      });

      // Notify admin (fire-and-forget)
      const buyerName = (order as any).userId?.name || 'Khách hàng';
      const amount = order.totalAmount.toLocaleString('vi-VN');
      createNotification(
        'new_order',
        'Đơn hàng mới',
        `${buyerName} vừa đặt đơn hàng #${order._id?.toString().slice(-6).toUpperCase()} — ${amount}₫`,
        { link: '?tab=orders', metadata: { orderId: order._id } }
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all orders with filters and pagination
   * GET /api/orders
   * Query: page, limit, status, paymentStatus, userId, search, startDate, endDate, sortBy, sortOrder
   */
  getAllOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        paymentStatus,
        userId,
        search,
        startDate,
        endDate,
        sortBy = 'orderDate',
        sortOrder = 'desc'
      } = req.query;

      const pageNum  = parseInt(page as string)  || 1;
      const limitNum = parseInt(limit as string) || 10;
      const skip     = (pageNum - 1) * limitNum;

      const filter: any = {};

      if (status)        filter.status        = status;
      if (paymentStatus) filter.paymentStatus = paymentStatus;
      if (userId)        filter.userId        = userId;
      if (req.query.groupId && mongoose.Types.ObjectId.isValid(req.query.groupId as string)) {
        filter.groupId = new mongoose.Types.ObjectId(req.query.groupId as string);
      }

      // Date range on orderDate
      if (startDate || endDate) {
        filter.orderDate = {};
        if (startDate) filter.orderDate.$gte = new Date(startDate as string);
        if (endDate)   filter.orderDate.$lte = new Date(endDate as string);
      }

      // Search by customer name / email — resolve matching user IDs first
      if (search && typeof search === 'string' && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        const matchedUsers = await User.find({
          $or: [{ name: regex }, { email: regex }]
        }).select('_id');
        const matchedIds = matchedUsers.map((u) => u._id);

        if (matchedIds.length === 0) {
          // Also allow matching by partial _id string
          if (mongoose.Types.ObjectId.isValid(search.trim())) {
            filter.$or = [
              { userId: new mongoose.Types.ObjectId(search.trim()) },
              { userId: { $in: matchedIds } }
            ];
          } else {
            // No users matched and search is not an ObjectId — return empty
            res.status(200).json({
              success: true,
              data: [],
              pagination: { currentPage: pageNum, totalPages: 0, totalItems: 0, itemsPerPage: limitNum }
            });
            return;
          }
        } else {
          filter.userId = { $in: matchedIds };
        }
      }

      const sortObj: any = {};
      sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

      const [orders, total] = await Promise.all([
        Order.find(filter)
          .sort(sortObj)
          .skip(skip)
          .limit(limitNum)
          .populate('userId', 'name email phone avatar')
          .populate('addressId')
          .populate('items.productId', 'name price thumbnail')
          .populate('confirmedBy', 'name email'),
        Order.countDocuments(filter)
      ]);

      const pages = Math.ceil(total / limitNum);

      res.status(200).json({
        success: true,
        data: orders,
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
   * Get orders for logged-in user
   * GET /api/orders/my-orders
   */
  getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10, status } = req.query;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;

      const userObjectId = new mongoose.Types.ObjectId(userId);
      const filter: any = {
        $or: [
          { userId: userObjectId },
          { memberIds: userObjectId },
        ],
      };

      if (status) {
        filter.status = status;
      }

      const orders = await Order.find(filter)
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('addressId')
        .populate('items.productId', 'name price thumbnail');

      const total = await Order.countDocuments(filter);
      const pages = Math.ceil(total / limitNum);

      res.status(200).json({
        success: true,
        data: orders,
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
   * Get order by ID
   * GET /api/orders/:id
   */
  getOrderById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const order = await Order.findById(id)
        .populate('userId', 'name email phone')
        .populate('addressId')
        .populate('voucherId')
        .populate('items.productId', 'name price thumbnail description');

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      // Check if user is owner, a group member, or admin
      const orderUserId = (order.userId as any)?._id?.toString() ?? order.userId.toString();
      const memberIds: string[] = ((order as any).memberIds ?? []).map((id: any) => id?.toString());
      const isGroupMember = memberIds.includes(req.user?.id ?? '');
      if (req.user?.role !== 'admin' && req.user?.id !== orderUserId && !isGroupMember) {
        throw new AppError('You do not have permission to view this order', 403);
      }

      res.status(200).json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update order status
   * PATCH /api/orders/:id/status
   */
  updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        throw new AppError('Status is required', 400);
      }

      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
      if (!validStatuses.includes(status)) {
        throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
      }

      const order = await Order.findByIdAndUpdate(
        id,
        {
          status,
          ...(status === 'delivered' && { deliveredAt: new Date() }),
          ...(status === 'cancelled' && { cancelledAt: new Date() })
        },
        { new: true, runValidators: true }
      ).populate('userId', 'name email');

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      // Handle voucher usage based on new status
      if (status === 'confirmed' && order.voucherId) {
        const usageUp = await VoucherUsage.updateMany(
          { orderId: id, status: 'pending' },
          { status: 'used' }
        );
        if (usageUp.modifiedCount > 0) {
          await Voucher.findByIdAndUpdate(order.voucherId, { $inc: { usageCount: 1 } });
        }
      } else if (['cancelled', 'refunded'].includes(status) && order.voucherId) {
        const usages = await VoucherUsage.find({ orderId: id, status: { $in: ['pending', 'used'] } });
        const hadUsed = usages.some(u => u.status === 'used');
        await VoucherUsage.updateMany(
          { orderId: id, status: { $in: ['pending', 'used'] } },
          { status: 'cancelled' }
        );
        if (hadUsed) {
          await Voucher.findByIdAndUpdate(order.voucherId, { $inc: { usageCount: -1 } });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Order status updated successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cancel order (by customer)
   * PATCH /api/orders/:id/cancel
   */
  cancelOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { cancelReason } = req.body;

      const order = await Order.findById(id);

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      const isOwner   = req.user?.id === order.userId.toString();
      const isManager = ['admin', 'manager'].includes(req.user?.role ?? '');

      if (!isOwner && !isManager) {
        throw new AppError('You do not have permission to cancel this order', 403);
      }

      // Can only cancel pending or confirmed orders
      if (!['pending', 'confirmed'].includes(order.status)) {
        throw new AppError(`Cannot cancel order with status: ${order.status}`, 400);
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        {
          status: 'cancelled',
          cancelReason: cancelReason || (isOwner ? 'Customer requested cancellation' : 'Cancelled by manager'),
          cancelledAt: new Date()
        },
        { new: true, runValidators: true }
      ).populate('userId', 'name email phone')
       .populate('items.productId', 'name price thumbnail');

      // Restore stock
      if (updatedOrder && updatedOrder.items.length > 0) {
        const restoreOps = updatedOrder.items.map((item: any) => ({
          updateOne: {
            filter: { _id: item.productId?._id || item.productId },
            update: { $inc: { stock: item.quantity } }
          }
        }));
        await Product.bulkWrite(restoreOps);
      }

      // Release voucher usage → cancelled (user can reuse)
      if (order.voucherId) {
        const usages = await VoucherUsage.find({ orderId: id, status: { $in: ['pending', 'used'] } });
        const hadUsed = usages.some(u => u.status === 'used');
        await VoucherUsage.updateMany(
          { orderId: id, status: { $in: ['pending', 'used'] } },
          { status: 'cancelled' }
        );
        if (hadUsed) {
          await Voucher.findByIdAndUpdate(order.voucherId, { $inc: { usageCount: -1 } });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Order cancelled successfully',
        data: updatedOrder
      });
    } catch (error) {
      next(error);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // ORDER CONFIRMATION FEATURE
  // ─────────────────────────────────────────────────────────────────

  /**
   * Confirm a single pending order (manager/admin only)
   * PATCH /api/orders/:id/confirm
   */
  confirmOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const managerId = req.user?.id;

      const order = await Order.findById(id);

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.status !== 'pending') {
        throw new AppError(
          `Only pending orders can be confirmed. Current status: ${order.status}`,
          400
        );
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        {
          status: 'confirmed',
          confirmedAt: new Date(),
          confirmedBy: managerId
        },
        { new: true, runValidators: true }
      )
        .populate('userId', 'name email phone avatar')
        .populate('addressId')
        .populate('items.productId', 'name price thumbnail')
        .populate('confirmedBy', 'name email');

      // Confirm voucher usage: pending → used + increment usageCount
      const usageUpdate = await VoucherUsage.updateMany(
        { orderId: id, status: 'pending' },
        { status: 'used' }
      );
      if (usageUpdate.modifiedCount > 0 && order.voucherId) {
        await Voucher.findByIdAndUpdate(order.voucherId, { $inc: { usageCount: 1 } });
      }

      // Cascade: confirm all member sub-orders for the same group order
      if (updatedOrder?.groupId && updatedOrder.orderType === 'group_buy') {
        const gid = (updatedOrder.groupId as any)?._id ?? updatedOrder.groupId;
        await Order.updateMany(
          {
            groupId: gid,
            _id: { $ne: new mongoose.Types.ObjectId(id) },
            status: 'pending',
          },
          {
            $set: {
              status: 'confirmed',
              confirmedAt: new Date(),
              confirmedBy: new mongoose.Types.ObjectId(managerId as string),
            },
          }
        );
      }

      res.status(200).json({
        success: true,
        message: 'Order confirmed successfully',
        data: updatedOrder
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Manager cancel order (manager/admin only — bypasses owner check)
   * PATCH /api/orders/:id/manager-cancel
   */
  managerCancelOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { cancelReason } = req.body;

      const order = await Order.findById(id);

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (!['pending', 'confirmed'].includes(order.status)) {
        throw new AppError(
          `Cannot cancel order with status: ${order.status}. Only pending or confirmed orders may be cancelled.`,
          400
        );
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        {
          status: 'cancelled',
          cancelReason: cancelReason || 'Cancelled by manager',
          cancelledAt: new Date()
        },
        { new: true, runValidators: true }
      )
        .populate('userId', 'name email phone avatar')
        .populate('addressId')
        .populate('items.productId', 'name price thumbnail');

      // Restore stock
      if (updatedOrder && updatedOrder.items.length > 0) {
        const restoreOps = updatedOrder.items.map((item: any) => ({
          updateOne: {
            filter: { _id: item.productId?._id || item.productId },
            update: { $inc: { stock: item.quantity } }
          }
        }));
        await Product.bulkWrite(restoreOps);
      }

      // Release voucher usage → cancelled (user can reuse)
      if (order.voucherId) {
        const usages = await VoucherUsage.find({ orderId: id, status: { $in: ['pending', 'used'] } });
        const hadUsed = usages.some(u => u.status === 'used');
        await VoucherUsage.updateMany(
          { orderId: id, status: { $in: ['pending', 'used'] } },
          { status: 'cancelled' }
        );
        if (hadUsed) {
          await Voucher.findByIdAndUpdate(order.voucherId, { $inc: { usageCount: -1 } });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Order cancelled by manager',
        data: updatedOrder
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk confirm multiple pending orders (manager/admin only)
   * POST /api/orders/bulk-confirm
   * Body: { orderIds: string[] }
   */
  bulkConfirmOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderIds } = req.body;
      const managerId = req.user?.id;

      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        throw new AppError('orderIds must be a non-empty array', 400);
      }

      if (orderIds.length > 100) {
        throw new AppError('Cannot confirm more than 100 orders at once', 400);
      }

      const validIds = orderIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
      if (validIds.length !== orderIds.length) {
        throw new AppError('One or more order IDs are invalid', 400);
      }

      // Only update orders that are actually pending
      const result = await Order.updateMany(
        { _id: { $in: validIds }, status: 'pending' },
        {
          $set: {
            status: 'confirmed',
            confirmedAt: new Date(),
            confirmedBy: new mongoose.Types.ObjectId(managerId)
          }
        }
      );

      // Confirm voucher usage for all confirmed orders: pending → used
      const confirmedOrders = await Order.find({ _id: { $in: validIds }, status: 'confirmed', voucherId: { $ne: null } });
      for (const o of confirmedOrders) {
        const usageUp = await VoucherUsage.updateMany(
          { orderId: o._id, status: 'pending' },
          { status: 'used' }
        );
        if (usageUp.modifiedCount > 0 && o.voucherId) {
          await Voucher.findByIdAndUpdate(o.voucherId, { $inc: { usageCount: 1 } });
        }
      }

      res.status(200).json({
        success: true,
        message: `${result.modifiedCount} order(s) confirmed successfully`,
        data: {
          requested:  orderIds.length,
          confirmed:  result.modifiedCount,
          skipped:    orderIds.length - result.modifiedCount
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get pending orders summary for badge counts (manager/admin only)
   * GET /api/orders/pending-summary
   */
  getPendingSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [pendingCount, todayCount] = await Promise.all([
        Order.countDocuments({ status: 'pending' }),
        Order.countDocuments({
          status: 'pending',
          orderDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        })
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalPending:  pendingCount,
          pendingToday:  todayCount
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update payment status
   * PATCH /api/orders/:id/payment-status
   */
  updatePaymentStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { paymentStatus } = req.body;

      if (!paymentStatus) {
        throw new AppError('Payment status is required', 400);
      }

      const validPaymentStatuses = ['pending', 'paid', 'failed'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        throw new AppError(`Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`, 400);
      }

      const order = await Order.findByIdAndUpdate(
        id,
        { paymentStatus },
        { new: true, runValidators: true }
      );

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      res.status(200).json({
        success: true,
        message: 'Payment status updated successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete order
   * DELETE /api/orders/:id
   */
  deleteOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const order = await Order.findById(id);

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      // Can only delete pending orders
      if (order.status !== 'pending') {
        throw new AppError(`Cannot delete order with status: ${order.status}`, 400);
      }

      // Restore stock before deleting
      if (order.items.length > 0) {
        const restoreOps = order.items.map((item: any) => ({
          updateOne: {
            filter: { _id: item.productId },
            update: { $inc: { stock: item.quantity } }
          }
        }));
        await Product.bulkWrite(restoreOps);
      }

      await Order.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Order deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get order statistics
   * GET /api/orders/stats/summary
   */
  getOrderStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      const filter: any = {};

      if (startDate && endDate) {
        filter.orderDate = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }

      const stats = await Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' }
          }
        }
      ]);

      const totalOrders = await Order.countDocuments(filter);
      const totalRevenue = (
        await Order.aggregate([
          { $match: filter },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ])
      )[0]?.total || 0;

      res.status(200).json({
        success: true,
        data: {
          totalOrders,
          totalRevenue,
          byStatus: stats
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update payment method for a subscription order (owner only, pending status only)
   * PATCH /api/orders/:id/payment-method
   * Body: { paymentMethod: 'cod' | 'momo' }
   */
  updatePaymentMethod = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { paymentMethod } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!paymentMethod) {
        throw new AppError('paymentMethod is required', 400);
      }

      const allowedMethods = ['cod', 'momo'];
      if (!allowedMethods.includes(paymentMethod)) {
        throw new AppError(`Invalid payment method. Must be one of: ${allowedMethods.join(', ')}`, 400);
      }

      const order = await Order.findById(id);

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      // Owner check
      if (order.userId.toString() !== userId) {
        throw new AppError('You do not have permission to update this order', 403);
      }

      // Must be a subscription order
      if (!order.subscriptionId) {
        throw new AppError('Payment method switching is only available for subscription orders', 400);
      }

      // Must still be pending (not yet accepted by manager)
      if (order.status !== 'pending') {
        throw new AppError(
          `Cannot change payment method for an order with status: ${order.status}. Only pending orders can be modified.`,
          400
        );
      }

      // Determine new paymentStatus based on method
      const isCOD = paymentMethod === 'cod';
      const newPaymentStatus = isCOD ? 'pending' : 'unpaid';

      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        {
          paymentMethod,
          paymentStatus: newPaymentStatus
        },
        { new: true, runValidators: true }
      )
        .populate('userId', 'name email phone')
        .populate('items.productId', 'name price thumbnail');

      res.status(200).json({
        success: true,
        message: `Payment method updated to ${paymentMethod.toUpperCase()}`,
        data: updatedOrder
      });
    } catch (error) {
      next(error);
    }
  };
}

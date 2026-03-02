import { Response, NextFunction } from 'express';
import { Order } from '../models/Order.model';
import { Address } from '../models/Address.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../utils/AppError';

export class OrderController {
  /**
   * Create a new order
   * POST /api/orders
   */
  createOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { addressId, deliveryInfo, voucherId, items, paymentMethod, notes } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!items || items.length === 0) {
        throw new AppError('Items are required', 400);
      }

      // Calculate totals
      let subtotal = 0;
      items.forEach((item: any) => {
        subtotal += item.subtotal;
      });

      const isCOD = paymentMethod === 'cod';

      const order = await Order.create({
        userId,
        addressId: addressId || null,
        deliveryInfo: deliveryInfo || {},
        voucherId: voucherId || null,
        items,
        paymentMethod: paymentMethod || 'credit_card',
        paymentStatus: isCOD ? 'unpaid' : 'pending',
        totalAmount: subtotal,
        notes,
        status: 'pending',
        orderDate: new Date()
      });

      await order.populate('userId', 'name email phone');
      await order.populate('items.productId', 'name price');

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all orders with filters and pagination
   * GET /api/orders
   */
  getAllOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 10, status, userId, sortBy = 'orderDate', sortOrder = 'desc' } = req.query;

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;

      const filter: any = {};

      if (status) {
        filter.status = status;
      }

      if (userId) {
        filter.userId = userId;
      }

      const sortObj: any = {};
      sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

      const orders = await Order.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'name email phone')
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

      const filter: any = { userId };

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

      // Check if user is owner or admin
      // After populate(), userId becomes a User object, so use _id to get the actual ID
      const orderUserId = (order.userId as any)?._id?.toString() ?? order.userId.toString();
      if (req.user?.role !== 'admin' && req.user?.id !== orderUserId) {
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
   * Cancel order
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

      // Check if user is owner
      if (req.user?.id !== order.userId.toString()) {
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
          cancelReason: cancelReason || 'User requested cancellation',
          cancelledAt: new Date()
        },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: 'Order cancelled successfully',
        data: updatedOrder
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
}
